import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { Prisma, ContactStatus, ContactType } from "@/app/generated/prisma/client";
import { sendEmail, generateContactConfirmationEmailHTML, generateContactNotificationEmailHTML } from "@/lib/email";

const ContactCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Invalid email address"),
  phone: z.string().trim().optional().or(z.literal('')).nullable(),
  subject: z.string().trim().optional().or(z.literal('')).nullable(),
  message: z.string().trim().min(10, "Message must be at least 10 characters"),
  type: z.enum(["General", "Consignment", "Support", "Bidding", "Other"]).optional().default("General"),
  userId: z.string().optional().nullable().or(z.literal(null)),
});

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    const whereClause: Prisma.ContactWhereInput = {};

    if (status) {
      whereClause.status = status as ContactStatus;
    }
    if (type) {
      whereClause.type = type as ContactType;
    }

    const contacts = await prisma.contact.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(contacts);
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    
    // Preprocess the data - trim strings and handle empty values
    const processedBody = {
      name: body.name?.trim() || '',
      email: body.email?.trim() || '',
      phone: body.phone?.trim() || undefined,
      subject: body.subject?.trim() || undefined,
      message: body.message?.trim() || '',
      type: body.type || 'General',
      userId: body.userId || null,
    };
    
    console.log('Received contact form data:', processedBody);
    
    const validation = ContactCreateSchema.safeParse(processedBody);

    if (!validation.success) {
      const errorMessages = validation.error.issues.map(issue => {
        const field = issue.path.length > 0 ? issue.path.join('.') : 'form';
        return `${field}: ${issue.message}`;
      }).join(', ');
      
      // Get the first error for a more user-friendly message
      const firstError = validation.error.issues[0];
      const fieldName = firstError.path.length > 0 ? firstError.path[0] : 'field';
      const userFriendlyMessage = `${fieldName === 'message' ? 'Message' : fieldName === 'name' ? 'Name' : fieldName === 'email' ? 'Email' : 'Field'}: ${firstError.message}`;
      
      return NextResponse.json(
        { 
          error: userFriendlyMessage, 
          details: validation.error.issues, 
          message: errorMessages 
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Create contact in database
    let contact;
    try {
      contact = await prisma.contact.create({
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone || null,
          subject: data.subject || `${data.type || "General"} Inquiry`,
          message: data.message,
          type: data.type || "General",
          userId: data.userId || null,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });
    } catch (dbError: any) {
      console.error("Database error creating contact:", dbError);
      
      // Handle Prisma errors
      if (dbError.code === 'P2002') {
        return NextResponse.json(
          { error: "A contact with this information already exists" },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { error: "Failed to save contact. Please try again.", details: dbError.message },
        { status: 500 }
      );
    }

    // Send confirmation email to user (non-blocking)
    try {
      const confirmationHTML = generateContactConfirmationEmailHTML(
        data.name,
        data.type || "General"
      );

      await sendEmail({
        to: data.email,
        subject: `Thank You for Contacting Us - ${data.subject || `${data.type || "General"} Inquiry`}`,
        html: confirmationHTML,
      });
      console.log('Confirmation email sent successfully to:', data.email);
    } catch (emailError: any) {
      console.error('Error sending confirmation email:', emailError);
      // Don't fail the request if email fails - contact is already saved
    }

    // Send notification email to admin (non-blocking)
    try {
      const adminEmail = process.env.APP_EMAIL || process.env.SMTP_USER || process.env.ADMIN_EMAIL;
      if (adminEmail) {
        const notificationHTML = generateContactNotificationEmailHTML(
          data.name,
          data.email,
          data.phone || null,
          data.type || "General",
          data.subject || `${data.type || "General"} Inquiry`,
          data.message
        );

        await sendEmail({
          to: adminEmail,
          subject: `New Contact Form Submission - ${data.type || "General"} Inquiry from ${data.name}`,
          html: notificationHTML,
        });
        console.log('Notification email sent successfully to:', adminEmail);
      } else {
        console.warn('No admin email configured. Notification email not sent.');
      }
    } catch (emailError: any) {
      console.error('Error sending notification email:', emailError);
      // Don't fail the request if email fails - contact is already saved
    }

    return NextResponse.json(contact, { status: 201 });
  } catch (error: any) {
    console.error("Error creating contact:", error);
    
    // Provide more specific error messages
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid request data. Please check your input." },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || "Internal server error. Please try again." },
      { status: 500 }
    );
  }
}

