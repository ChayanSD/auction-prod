import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransport({
   service : "gmail",
   auth : {
    user : process.env.APP_EMAIL,
    pass : process.env.APP_PASSWORD,
   }
  });
};

/**
 * Send email
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    // Skip email sending if SMTP is not configured
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.warn('SMTP not configured. Email not sent:', options.to);
      return;
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: `"${process.env.SMTP_FROM_NAME || 'Auction Platform'}" <${process.env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      text: options.text || options.html.replace(/<[^>]*>/g, ''), // Plain text fallback
      html: options.html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
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
 */
export function generateInvoiceEmailHTML(
  userName: string,
  invoiceNumber: string,
  itemName: string,
  bidAmount: number,
  additionalFee: number,
  totalAmount: number,
  lotCount: number,
  paymentLink: string
): string {
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
        <h1 style="color: white; margin: 0;">Congratulations! You Won the Auction</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
        <p style="font-size: 16px;">Dear ${userName},</p>
        
        <p style="font-size: 16px;">We are pleased to inform you that you have won the auction for:</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #9F13FB;">
          <h2 style="margin: 0 0 10px 0; color: #9F13FB;">${itemName}</h2>
          <p style="margin: 5px 0; color: #666;">Invoice Number: <strong>${invoiceNumber}</strong></p>
          <p style="margin: 5px 0; color: #666;">Lots: <strong>${lotCount}</strong></p>
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
              <td style="padding: 12px 0; font-size: 18px; font-weight: bold; color: #9F13FB;">Total Amount:</td>
              <td style="padding: 12px 0; font-size: 18px; font-weight: bold; text-align: right; color: #9F13FB;">£${totalAmount.toFixed(2)}</td>
            </tr>
          </table>
        </div>
        
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
        
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #999; text-align: center; margin: 0;">
          This is an automated email. Please do not reply to this message.
        </p>
      </div>
    </body>
    </html>
  `;
}

