import nodemailer from 'nodemailer';

interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType?: string;
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
}



// Create reusable transporter
const createTransporter = () => {
  // Use APP_EMAIL and APP_PASSWORD if available, otherwise fall back to SMTP_USER and SMTP_PASSWORD
  const email = process.env.APP_EMAIL || process.env.SMTP_USER;
  const password = process.env.APP_PASSWORD || process.env.SMTP_PASSWORD;
  
  return nodemailer.createTransport({
   service : "gmail",
   auth : {
    user : email,
    pass : password,
   }
  });
};

/**
 * Send email
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    // Skip email sending if email is not configured
    const email = process.env.APP_EMAIL || process.env.SMTP_USER;
    const password = process.env.APP_PASSWORD || process.env.SMTP_PASSWORD;
    
    if (!email || !password) {
      console.warn('Email not configured. Email not sent:', options.to);
      return;
    }

    let transporter;
    try {
      transporter = createTransporter();
    } catch (transporterError) {
      const errorMessage = transporterError instanceof Error ? transporterError.message : String(transporterError);
      console.error('Error creating email transporter:', transporterError);
      throw new Error(`Failed to create email transporter: ${errorMessage}`);
    }

    const fromEmail = process.env.APP_EMAIL || process.env.SMTP_USER || email;

    const mailOptions: {
      from: string;
      to: string;
      subject: string;
      text: string;
      html: string;
      attachments?: Array<{
        filename: string;
        content: Buffer;
        contentType?: string;
      }>;
    } = {
      from: `"${process.env.SMTP_FROM_NAME || 'Supermedia Bros'}" <${fromEmail}>`,
      to: options.to,
      subject: options.subject,
      text: options.text || options.html.replace(/<[^>]*>/g, ''), // Plain text fallback
      html: options.html,
    };

    // Add attachments if provided
    if (options.attachments && options.attachments.length > 0) {
      console.log(`Adding ${options.attachments.length} attachment(s) to email`);
      mailOptions.attachments = options.attachments.map(att => {
        const attachment: {
          filename: string;
          content: Buffer;
          contentType?: string;
        } = {
          filename: att.filename,
          content: att.content,
          contentType: att.contentType || 'application/pdf', // Default to PDF if not specified
        };
        console.log(`- Attachment: ${att.filename}, Size: ${att.content.length} bytes, ContentType: ${attachment.contentType}`);
        return attachment;
      });
    }

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    if (options.attachments && options.attachments.length > 0) {
      console.log(`Email sent with ${options.attachments.length} attachment(s)`);
    }
  } catch (error) {
    console.error('Error sending email:', error);
    // Re-throw with more context for debugging
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to send email: ${errorMessage}`);
  }
}

export function generatePaymentSuccessEmailHTML(
  userName: string,
  invoiceNumber: string,
  itemName: string,
  bidAmount: number,
  buyersPremium: number,
  taxAmount: number,
  totalAmount: number,
  lotCount: number,
  invoiceViewUrl?: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Successful - ${invoiceNumber}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Payment Successful!</h1>
        <p style="color: white; margin: 10px 0 0 0;">Your payment has been processed automatically</p>
      </div>

      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
        <p style="font-size: 16px;">Dear ${userName},</p>

        <p style="font-size: 16px;">Great news! Your payment for the winning auction bid has been processed successfully using your saved payment method.</p>

        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
          <h2 style="margin: 0 0 10px 0; color: #28a745;">${itemName}</h2>
          <p style="margin: 5px 0; color: #666;">Invoice Number: <strong>${invoiceNumber}</strong></p>
          <p style="margin: 5px 0; color: #666;">Lots: <strong>${lotCount}</strong></p>
          <p style="margin: 5px 0; color: #666;">Payment Status: <strong style="color: #28a745;">Paid</strong></p>
        </div>

        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">Payment Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Hammer (Winning Bid):</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">£${bidAmount.toFixed(2)}</td>
            </tr>
            ${buyersPremium > 0 ? `
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Buyer's Premium:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right;">£${buyersPremium.toFixed(2)}</td>
            </tr>
            ` : ''}
            ${taxAmount > 0 ? `
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Tax:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right;">£${taxAmount.toFixed(2)}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 12px 0; font-size: 18px; font-weight: bold; color: #28a745;">Total Paid:</td>
              <td style="padding: 12px 0; font-size: 18px; font-weight: bold; text-align: right; color: #28a745;">£${totalAmount.toFixed(2)}</td>
            </tr>
          </table>
        </div>

        <p style="font-size: 16px; color: #28a745; font-weight: bold;">Thank you for your purchase!</p>
        <p style="font-size: 14px; color: #666;">Your item will be shipped according to the auction terms. You will receive shipping updates via email.</p>

        ${invoiceViewUrl ? `
        <div style="text-align: center; margin: 30px 0; padding: 20px; background: white; border-radius: 8px; border: 2px solid #28a745;">
          <h3 style="margin: 0 0 15px 0; color: #333; font-size: 18px;">View & Download Your Invoice</h3>
          <p style="font-size: 14px; color: #666; margin-bottom: 20px;">
            Click the button below to view your invoice online and download it as a PDF.
          </p>
          <a href="${invoiceViewUrl}" 
             style="display: inline-block; background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(40, 167, 69, 0.3);">
            View Invoice & Download PDF
          </a>
          <p style="font-size: 12px; color: #999; margin-top: 15px;">
            Or copy this link: <a href="${invoiceViewUrl}" style="color: #28a745; word-break: break-all;">${invoiceViewUrl}</a>
          </p>
        </div>
        ` : ''}

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
 * Generate invoice email HTML template
 * Updated to match invoice format with UNPAID status and payment link
 */
// Updated function signature for combined invoices
export function generateInvoiceEmailHTML(params: {
  userName: string;
  invoiceNumber: string;
  auctionName: string;
  itemsCount: number;
  totalAmount: number;
  paymentLink: string;
  invoiceLink?: string;
  status?: 'Unpaid' | 'Paid' | 'Cancelled';
}): string {
  const {
    userName,
    invoiceNumber,
    auctionName,
    itemsCount,
    totalAmount,
    paymentLink,
    invoiceLink,
    status = 'Unpaid',
  } = params;
  const companyName = process.env.COMPANY_NAME || 'Super Media Bros';
  const companyEmail = process.env.APP_EMAIL || process.env.SMTP_USER || 'N/A';
  const companyPhone = process.env.COMPANY_PHONE || 'N/A';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invoice ${invoiceNumber}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #9F13FB 0%, #E95AFF 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Invoice ${invoiceNumber}</h1>
        ${status === 'Unpaid' ? '<h2 style="color: #FF0000; margin: 10px 0 0 0; font-size: 28px; font-weight: bold;">UNPAID</h2>' : ''}
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
        <p style="font-size: 16px;">Dear ${userName},</p>
        
        <p style="font-size: 16px;">Please find attached your invoice for the items you won in the following auction:</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #9F13FB;">
          <h2 style="margin: 0 0 10px 0; color: #9F13FB;">${auctionName}</h2>
          <p style="margin: 5px 0; color: #666;">Invoice Number: <strong>${invoiceNumber}</strong></p>
          <p style="margin: 5px 0; color: #666;">Items Won: <strong>${itemsCount} item(s)</strong></p>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">Payment Summary</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Total Items:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">${itemsCount}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; font-size: 18px; font-weight: bold; color: #9F13FB;">Invoice Total:</td>
              <td style="padding: 12px 0; font-size: 18px; font-weight: bold; text-align: right; color: #9F13FB;">£${totalAmount.toFixed(2)}</td>
            </tr>
            ${status === 'Unpaid' ? `
            <tr>
              <td style="padding: 12px 0; font-size: 18px; font-weight: bold; color: #FF0000;">Balance Due:</td>
              <td style="padding: 12px 0; font-size: 18px; font-weight: bold; text-align: right; color: #FF0000;">£${totalAmount.toFixed(2)}</td>
            </tr>
            ` : ''}
          </table>
          <p style="font-size: 14px; color: #666; margin-top: 15px;">
            <em>Detailed breakdown of each item (bid amount, buyer's premium, tax) is available in the attached PDF invoice.</em>
          </p>
        </div>
        
        ${status === 'Unpaid' && paymentLink ? `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${paymentLink}" 
             style="display: inline-block; background: linear-gradient(135deg, #9F13FB 0%, #E95AFF 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(159, 19, 251, 0.3);">
            Pay Now
          </a>
        </div>
        
        <p style="font-size: 14px; color: #666; margin-top: 30px;">
          Please complete your payment within 7 days to secure your purchase. If you have any questions, please contact our support team.
        </p>
        
        <p style="font-size: 14px; color: #666;">
          If the button above doesn't work, copy and paste this link into your browser:<br>
          <a href="${paymentLink}" style="color: #9F13FB; word-break: break-all;">${paymentLink}</a>
        </p>
        ` : ''}
        
        ${invoiceLink ? `
        <div style="text-align: center; margin: 30px 0; padding: 20px; background: white; border-radius: 8px; border: 2px solid #9F13FB;">
          <h3 style="margin: 0 0 15px 0; color: #333; font-size: 18px;">View & Download Your Invoice</h3>
          <p style="font-size: 14px; color: #666; margin-bottom: 20px;">
            Click the button below to view your invoice online and download it as a PDF.
          </p>
          <a href="${invoiceLink}" 
             style="display: inline-block; background: linear-gradient(135deg, #9F13FB 0%, #E95AFF 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(159, 19, 251, 0.3);">
            View Invoice & Download PDF
          </a>
          <p style="font-size: 12px; color: #999; margin-top: 15px;">
            Or copy this link: <a href="${invoiceLink}" style="color: #9F13FB; word-break: break-all;">${invoiceLink}</a>
          </p>
        </div>
        ` : ''}
        
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #999; text-align: center; margin: 0;">
          This is an automated email from ${companyName}. For support, contact ${companyEmail} or ${companyPhone}.
        </p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate contact form confirmation email HTML template (sent to user)
 */
export function generateContactConfirmationEmailHTML(
  userName: string,
  inquiryType: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Thank You for Contacting Us</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #9F13FB 0%, #E95AFF 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Thank You for Contacting Us!</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
        <p style="font-size: 16px;">Dear ${userName},</p>
        
        <p style="font-size: 16px;">We have received your ${inquiryType} inquiry and appreciate you taking the time to reach out to us.</p>
        
        <p style="font-size: 16px;">Our team will review your message and get back to you as soon as possible, typically within 24-48 hours.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #9F13FB;">
          <p style="margin: 0; color: #666;"><strong>Inquiry Type:</strong> ${inquiryType}</p>
        </div>
        
        <p style="font-size: 14px; color: #666;">
          If you have any urgent questions, please don't hesitate to contact us directly.
        </p>
        
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #999; text-align: center; margin: 0;">
          This is an automated confirmation email. Please do not reply to this message.
        </p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate contact form notification email HTML template (sent to admin)
 */
export function generateContactNotificationEmailHTML(
  name: string,
  email: string,
  phone: string | null,
  inquiryType: string,
  subject: string,
  message: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Contact Form Submission - ${inquiryType}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #9F13FB 0%, #E95AFF 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">New Contact Form Submission</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
        <p style="font-size: 16px;">You have received a new contact form submission:</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #9F13FB;">
          <h2 style="margin: 0 0 15px 0; color: #9F13FB;">${subject}</h2>
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold; width: 120px;">Name:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold;">Email:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><a href="mailto:${email}" style="color: #9F13FB;">${email}</a></td>
            </tr>
            ${phone ? `
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold;">Phone:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><a href="tel:${phone}" style="color: #9F13FB;">${phone}</a></td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold;">Type:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${inquiryType}</td>
            </tr>
          </table>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">Message:</h3>
          <p style="color: #666; white-space: pre-wrap;">${message}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="mailto:${email}" 
             style="display: inline-block; background: linear-gradient(135deg, #9F13FB 0%, #E95AFF 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(159, 19, 251, 0.3);">
            Reply to ${name}
          </a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #999; text-align: center; margin: 0;">
          This is an automated notification email from the contact form.
        </p>
      </div>
    </body>
    </html>
  `;
}


/**
 * Generate admin payment received email HTML template
 */
export function generateAdminPaymentReceivedEmailHTML(
  userName: string,
  userEmail: string,
  invoiceNumber: string,
  auctionName: string,
  itemsCount: number,
  totalAmount: number,
  invoiceViewUrl: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Received - Invoice ${invoiceNumber}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Payment Received</h1>
        <p style="color: white; margin: 10px 0 0 0;">A customer has successfully paid their invoice</p>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
        <p style="font-size: 16px;">A payment has been successfully processed for an invoice.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #007bff;">
          <h2 style="margin: 0 0 10px 0; color: #007bff;">Payment Details</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold; width: 150px;">Customer:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${userName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold;">Email:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><a href="mailto:${userEmail}" style="color: #007bff;">${userEmail}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold;">Invoice Number:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>${invoiceNumber}</strong></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold;">Auction:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${auctionName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold;">Items:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${itemsCount} item${itemsCount === 1 ? '' : 's'}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; font-size: 18px; font-weight: bold; color: #28a745;">Total Amount:</td>
              <td style="padding: 12px 0; font-size: 18px; font-weight: bold; color: #28a745;">£${totalAmount.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Status:</td>
              <td style="padding: 8px 0;"><span style="background: #28a745; color: white; padding: 4px 12px; border-radius: 4px; font-weight: bold;">Paid</span></td>
            </tr>
          </table>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${invoiceViewUrl}" 
             style="display: inline-block; background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(0, 123, 255, 0.3);">
            View Invoice Details
          </a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #999; text-align: center; margin: 0;">
          This is an automated notification email from Supermedia Bros.
        </p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate new bid notification email HTML template (sent to admins)
 */
export function generateNewBidEmailHTML(
  userName: string,
  userEmail: string,
  amount: number,
  itemName: string,
  itemUrl: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Bid Alert</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">New High Bid!</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
        <p style="font-size: 16px;">A new bid has been placed on an active auction.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #007bff;">
          <h2 style="margin: 0 0 10px 0; color: #007bff;">${itemName}</h2>
          <p style="margin: 5px 0; color: #666; font-size: 18px;">Bid Amount: <strong>£${amount.toFixed(2)}</strong></p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 15px 0;">
          <p style="margin: 5px 0; color: #666;">Bidder: <strong>${userName}</strong></p>
          <p style="margin: 5px 0; color: #666;">Email: <a href="mailto:${userEmail}" style="color: #007bff;">${userEmail}</a></p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${itemUrl}" 
             style="display: inline-block; background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(0, 123, 255, 0.3);">
            View Auction Item
          </a>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate outbid notification email HTML template (sent to previous bidder)
 * Industry-standard: includes item image, lot number, description, and professional footer
 */
export function generateOutbidEmailHTML(
  userName: string,
  itemName: string,
  newAmount: number,
  itemUrl: string,
  itemImage?: string | null,
  itemDescription?: string | null,
  lotNumber?: string | null,
  auctionName?: string | null
): string {
  const companyName = process.env.COMPANY_NAME || 'Supermedia Bros';
  const companyEmail = process.env.APP_EMAIL || process.env.SMTP_USER || 'N/A';
  const companyPhone = process.env.COMPANY_PHONE || 'N/A';
  
  // Truncate description if too long (industry standard: 150 chars max for email)
  const truncatedDescription = itemDescription && itemDescription.length > 150 
    ? itemDescription.substring(0, 150) + '...' 
    : itemDescription;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>You've Been Outbid</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #ffc107 0%, #e0a800 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; text-shadow: 0 1px 2px rgba(0,0,0,0.1);">You've Been Outbid!</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
        <p style="font-size: 16px;">Dear ${userName},</p>
        
        <p style="font-size: 16px;">Someone has placed a higher bid on an item you were watching.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
          ${itemImage ? `
          <div style="text-align: center; margin-bottom: 15px;">
            <img src="${itemImage}" alt="${itemName}" style="max-width: 100%; height: auto; border-radius: 8px; max-height: 200px; object-fit: cover;">
          </div>
          ` : ''}
          
          ${lotNumber ? `
          <div style="margin-bottom: 10px;">
            <span style="background: #fff3cd; color: #856404; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; text-transform: uppercase;">Lot #${lotNumber}</span>
          </div>
          ` : ''}
          
          <h2 style="margin: 0 0 10px 0; color: #333; font-size: 20px;">${itemName}</h2>
          
          ${auctionName ? `
          <p style="margin: 5px 0 10px 0; color: #666; font-size: 14px;">Auction: <strong>${auctionName}</strong></p>
          ` : ''}
          
          ${truncatedDescription ? `
          <p style="margin: 10px 0; color: #666; font-size: 14px; line-height: 1.5;">${truncatedDescription}</p>
          ` : ''}
          
          <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #eee;">
            <p style="margin: 0; color: #666; font-size: 14px;">New High Bid:</p>
            <p style="margin: 5px 0 0 0; color: #d39e00; font-size: 24px; font-weight: bold;">£${newAmount.toFixed(2)}</p>
          </div>
        </div>
        
        <p style="font-size: 16px;">Don't let this item get away! Click the button below to increase your bid.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${itemUrl}" 
             style="display: inline-block; background: linear-gradient(135deg, #ffc107 0%, #e0a800 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(255, 193, 7, 0.3);">
            Place New Bid
          </a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #999; text-align: center; margin: 0;">
          This is an automated email from ${companyName}. For support, contact ${companyEmail} or ${companyPhone}.
        </p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate upcoming auction newsletter email HTML template
 */
export function generateUpcomingAuctionNewsletterHTML(params: {
  userName: string;
  auctionName: string;
  auctionDescription?: string;
  auctionImageUrl?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  itemCount?: number;
  auctionUrl: string;
  unsubscribeUrl: string;
}): string {
  const {
    userName,
    auctionName,
    auctionDescription,
    auctionImageUrl,
    startDate,
    endDate,
    location,
    itemCount,
    auctionUrl,
    unsubscribeUrl,
  } = params;
  
  const companyName = process.env.COMPANY_NAME || 'Supermedia Bros';
  const companyEmail = process.env.APP_EMAIL || process.env.SMTP_USER || 'N/A';
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'TBA';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Upcoming Auction: ${auctionName}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #9F13FB 0%, #E95AFF 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; text-shadow: 0 1px 2px rgba(0,0,0,0.1);">Upcoming Auction</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
        <p style="font-size: 16px;">Dear ${userName},</p>
        
        <p style="font-size: 16px;">We're excited to announce an upcoming auction that might interest you!</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #9F13FB;">
          ${auctionImageUrl ? `
          <div style="text-align: center; margin-bottom: 15px;">
            <img src="${auctionImageUrl}" alt="${auctionName}" style="max-width: 100%; height: auto; border-radius: 8px; max-height: 250px; object-fit: cover;">
          </div>
          ` : ''}
          
          <h2 style="margin: 0 0 15px 0; color: #9F13FB; font-size: 24px;">${auctionName}</h2>
          
          ${auctionDescription ? `
          <p style="margin: 10px 0; color: #666; font-size: 14px; line-height: 1.6;">${auctionDescription.substring(0, 300)}${auctionDescription.length > 300 ? '...' : ''}</p>
          ` : ''}
          
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
            ${startDate ? `
            <p style="margin: 8px 0; color: #666; font-size: 14px;">
              <strong style="color: #333;">Start Date:</strong> ${formatDate(startDate)}
            </p>
            ` : ''}
            ${endDate ? `
            <p style="margin: 8px 0; color: #666; font-size: 14px;">
              <strong style="color: #333;">End Date:</strong> ${formatDate(endDate)}
            </p>
            ` : ''}
            ${location ? `
            <p style="margin: 8px 0; color: #666; font-size: 14px;">
              <strong style="color: #333;">Location:</strong> ${location}
            </p>
            ` : ''}
            ${itemCount !== undefined ? `
            <p style="margin: 8px 0; color: #666; font-size: 14px;">
              <strong style="color: #333;">Items:</strong> ${itemCount} lot${itemCount !== 1 ? 's' : ''}
            </p>
            ` : ''}
          </div>
        </div>
        
        <p style="font-size: 16px;">Don't miss out on this exciting auction! Click below to view all lots and start bidding.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${auctionUrl}" 
             style="display: inline-block; background: linear-gradient(135deg, #9F13FB 0%, #E95AFF 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(159, 19, 251, 0.3);">
            View Auction
          </a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #999; text-align: center; margin: 0;">
          This email was sent to you because you subscribed to upcoming auction notifications from ${companyName}. 
          <br>
          <a href="${unsubscribeUrl}" style="color: #9F13FB; text-decoration: underline;">Unsubscribe from future emails</a>
        </p>
        <p style="font-size: 12px; color: #999; text-align: center; margin: 10px 0 0 0;">
          For support, contact ${companyEmail}
        </p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate general news newsletter email HTML template
 */
export function generateGeneralNewsletterHTML(params: {
  userName: string;
  subject: string;
  content: string;
  imageUrl?: string;
  readMoreUrl?: string;
  unsubscribeUrl: string;
}): string {
  const {
    userName,
    subject,
    content,
    imageUrl,
    readMoreUrl,
    unsubscribeUrl,
  } = params;
  
  const companyName = process.env.COMPANY_NAME || 'Supermedia Bros';
  const companyEmail = process.env.APP_EMAIL || process.env.SMTP_USER || 'N/A';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #9F13FB 0%, #E95AFF 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; text-shadow: 0 1px 2px rgba(0,0,0,0.1);">${subject}</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
        <p style="font-size: 16px;">Dear ${userName},</p>
        
        ${imageUrl ? `
        <div style="text-align: center; margin: 20px 0;">
          <img src="${imageUrl}" alt="${subject}" style="max-width: 100%; height: auto; border-radius: 8px; max-height: 250px; object-fit: cover;">
        </div>
        ` : ''}
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #9F13FB;">
          <div style="color: #666; font-size: 14px; line-height: 1.8; white-space: pre-line;">${content}</div>
        </div>
        
        ${readMoreUrl ? `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${readMoreUrl}" 
             style="display: inline-block; background: linear-gradient(135deg, #9F13FB 0%, #E95AFF 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(159, 19, 251, 0.3);">
            Read More
          </a>
        </div>
        ` : ''}
        
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #999; text-align: center; margin: 0;">
          This email was sent to you because you subscribed to newsletter updates from ${companyName}. 
          <br>
          <a href="${unsubscribeUrl}" style="color: #9F13FB; text-decoration: underline;">Unsubscribe from future emails</a>
        </p>
        <p style="font-size: 12px; color: #999; text-align: center; margin: 10px 0 0 0;">
          For support, contact ${companyEmail}
        </p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate new item newsletter email HTML template
 */
export function generateNewItemNewsletterHTML(params: {
  userName: string;
  itemName: string;
  itemDescription?: string;
  itemImageUrl?: string;
  baseBidPrice?: number;
  lotNumber?: string;
  auctionName: string;
  itemUrl: string;
  unsubscribeUrl: string;
}): string {
  const {
    userName,
    itemName,
    itemDescription,
    itemImageUrl,
    baseBidPrice,
    lotNumber,
    auctionName,
    itemUrl,
    unsubscribeUrl,
  } = params;
  
  const companyName = process.env.COMPANY_NAME || 'Supermedia Bros';
  const companyEmail = process.env.APP_EMAIL || process.env.SMTP_USER || 'N/A';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Item Added: ${itemName}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; text-shadow: 0 1px 2px rgba(0,0,0,0.1);">New Item Added!</h1>
        <p style="color: white; margin: 10px 0 0 0;">A new lot is available for bidding</p>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
        <p style="font-size: 16px;">Dear ${userName},</p>
        
        <p style="font-size: 16px;">A new item has just been added to the <strong>${auctionName}</strong>. Check it out and be the first to bid!</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #007bff;">
          ${itemImageUrl ? `
          <div style="text-align: center; margin-bottom: 15px;">
            <img src="${itemImageUrl}" alt="${itemName}" style="max-width: 100%; height: auto; border-radius: 8px; max-height: 250px; object-fit: cover;">
          </div>
          ` : ''}
          
          ${lotNumber ? `
          <div style="margin-bottom: 10px;">
            <span style="background: #e7f3ff; color: #007bff; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; text-transform: uppercase;">Lot #${lotNumber}</span>
          </div>
          ` : ''}
          
          <h2 style="margin: 0 0 10px 0; color: #007bff; font-size: 22px;">${itemName}</h2>
          
          ${itemDescription ? `
          <p style="margin: 10px 0; color: #666; font-size: 14px; line-height: 1.6;">${itemDescription.substring(0, 200)}${itemDescription.length > 200 ? '...' : ''}</p>
          ` : ''}
          
          <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #eee;">
            ${baseBidPrice !== undefined ? `
            <p style="margin: 5px 0; color: #666; font-size: 14px;"> Starting Bid: <strong style="color: #333;">£${baseBidPrice.toFixed(2)}</strong></p>
            ` : ''}
            <p style="margin: 5px 0; color: #666; font-size: 14px;"> Auction: <strong style="color: #333;">${auctionName}</strong></p>
          </div>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${itemUrl}" 
             style="display: inline-block; background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(0, 123, 255, 0.3);">
            Place Your Bid
          </a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #999; text-align: center; margin: 0;">
          This email was sent to you because you subscribed to newsletter updates from ${companyName}. 
          <br>
          <a href="${unsubscribeUrl}" style="color: #007bff; text-decoration: underline;">Unsubscribe from future emails</a>
        </p>
        <p style="font-size: 12px; color: #999; text-align: center; margin: 10px 0 0 0;">
          For support, contact ${companyEmail}
        </p>
      </div>
    </body>
    </html>
  `;
}
