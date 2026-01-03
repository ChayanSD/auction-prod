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
      from: `"${process.env.SMTP_FROM_NAME || 'Auction Platform'}" <${fromEmail}>`,
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
  additionalFee: number,
  totalAmount: number,
  lotCount: number
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
              <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Winning Bid:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">£${bidAmount.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Additional Fees:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right;">£${additionalFee.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; font-size: 18px; font-weight: bold; color: #28a745;">Total Paid:</td>
              <td style="padding: 12px 0; font-size: 18px; font-weight: bold; text-align: right; color: #28a745;">£${totalAmount.toFixed(2)}</td>
            </tr>
          </table>
        </div>

        <p style="font-size: 16px; color: #28a745; font-weight: bold;">Thank you for your purchase!</p>
        <p style="font-size: 14px; color: #666;">Your item will be shipped according to the auction terms. You will receive shipping updates via email.</p>

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
export function generateInvoiceEmailHTML(
  userName: string,
  invoiceNumber: string,
  itemName: string,
  bidAmount: number,
  additionalFee: number,
  totalAmount: number,
  lotCount: number,
  paymentLink: string,
  status: 'Unpaid' | 'Paid' | 'Cancelled' = 'Unpaid',
  auctionName?: string,
  auctionDate?: string
): string {
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
        
        <p style="font-size: 16px;">Please find attached your invoice for the following auction item:</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #9F13FB;">
          <h2 style="margin: 0 0 10px 0; color: #9F13FB;">${itemName}</h2>
          <p style="margin: 5px 0; color: #666;">Invoice Number: <strong>${invoiceNumber}</strong></p>
          ${auctionName ? `<p style="margin: 5px 0; color: #666;">Auction: <strong>${auctionName}</strong></p>` : ''}
          ${auctionDate ? `<p style="margin: 5px 0; color: #666;">Auction Date: <strong>${auctionDate}</strong></p>` : ''}
          ${lotCount ? `<p style="margin: 5px 0; color: #666;">Lots: <strong>${lotCount}</strong></p>` : ''}
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">Payment Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Hammer (Winning Bid):</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">£${bidAmount.toFixed(2)}</td>
            </tr>
            ${additionalFee > 0 ? `
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Buyer's Premium:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right;">£${additionalFee.toFixed(2)}</td>
            </tr>
            ` : ''}
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
        
        <p style="font-size: 14px; color: #666; margin-top: 20px;">
          <strong>Note:</strong> A detailed PDF invoice is attached to this email for your records.
        </p>
        
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

