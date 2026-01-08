import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { sendEmail } from "@/lib/email";

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address").transform((val) => val.toLowerCase().trim()),
});

/**
 * Generate OTP email HTML template
 */
function generateOTPEmailHTML(otp: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset OTP</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #9F13FB 0%, #E95AFF 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Password Reset Request</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
        <p style="font-size: 16px;">You have requested to reset your password.</p>
        
        <p style="font-size: 16px;">Please use the following OTP code to verify your identity:</p>
        
        <div style="background: white; padding: 30px; border-radius: 8px; margin: 20px 0; border: 2px solid #9F13FB; text-align: center;">
          <h2 style="margin: 0; color: #9F13FB; font-size: 36px; letter-spacing: 8px; font-family: 'Courier New', monospace;">
            ${otp}
          </h2>
        </div>
        
        <p style="font-size: 14px; color: #666;">
          <strong>Important:</strong> This OTP will expire in 2 minutes. If you did not request this password reset, please ignore this email.
        </p>
        
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #999; text-align: center; margin: 0;">
          This is an automated email. Please do not reply to this message.
        </p>
      </div>
    </body>
    </html>
  `;
}

/**
 * POST /api/auth/forgot-password
 * Generate and send OTP for password reset
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const validation = forgotPasswordSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || "Invalid email address" },
        { status: 400 }
      );
    }

    const { email } = validation.data;
    // Email is already normalized by schema transform

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: email },
    });

    // For security, don't reveal if user exists or not
    // Always return success message
    if (!user) {
      // Still return success to prevent email enumeration
      return NextResponse.json({
        success: true,
        message: "If an account exists with this email, an OTP has been sent.",
      });
    }

    // Generate 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    // Store OTP in Redis with 2 minutes expiration (120 seconds)
    // Email is already normalized
    const redisKey = `forgot-password:${email}`;
    // Ensure OTP is stored as a string
    await redis.set(redisKey, otp, { ex: 120 }); // ex: expiration in seconds
    
    // Debug logging
    console.log('OTP Generated and Stored:', {
      email: email,
      otp: otp,
      otpType: typeof otp,
      otpLength: otp.length,
      redisKey: redisKey,
    });

    // Send OTP email
    try {
      await sendEmail({
        to: email,
        subject: "Password Reset OTP - Auction Platform",
        html: generateOTPEmailHTML(otp),
      });
    } catch (emailError) {
      console.error("Error sending OTP email:", emailError);
      // Don't fail the request if email fails (for security)
      // Still return success to prevent email enumeration
    }

    return NextResponse.json({
      success: true,
      message: "If an account exists with this email, an OTP has been sent.",
    });
  } catch (error) {
    console.error("Error in forgot password:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

