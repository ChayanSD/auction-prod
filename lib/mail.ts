import { sendEmail as transportSendEmail, generateSettlementGeneratedEmailHTML, generateSettlementPaidEmailHTML } from './email';

interface SendEmailParams {
  to: string;
  subject: string;
  template: 'settlement_generated' | 'payment_confirmed' | 'item_received' | 'settlement_reminder' | 'seller_approved' | 'document_activity';
  data: any;
}

export async function sendEmail({ to, subject, template, data }: SendEmailParams) {
  console.log(`[EMAIL SERVICE] Sending ${template} to ${to}: ${subject}`);
  
  let html = '';
  const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://elevateitauctions.com'}/profile/seller-portal`;

  if (template === 'settlement_generated') {
      html = generateSettlementGeneratedEmailHTML({
          sellerName: data.sellerName,
          reference: data.reference,
          netPayout: data.netPayout,
          viewUrl: portalUrl
      });
  } else if (template === 'payment_confirmed') {
      html = generateSettlementPaidEmailHTML({
          sellerName: data.sellerName,
          reference: data.reference,
          netPayout: data.netPayout,
          paidAt: new Date().toLocaleDateString()
      });
  } else if (template === 'settlement_reminder') {
      const { generateSettlementReminderEmailHTML } = await import('./email');
      html = generateSettlementReminderEmailHTML({
          sellerName: data.sellerName,
          reference: data.reference,
          netPayout: data.netPayout,
          viewUrl: portalUrl
      });
  } else if (template === 'seller_approved') {
      const { generateSellerApprovedEmailHTML } = await import('./email');
      html = generateSellerApprovedEmailHTML({
          sellerName: data.sellerName,
          portalUrl: portalUrl
      });
  } else if (template === 'document_activity') {
      const { generateDocumentActivityEmailHTML } = await import('./email');
      html = generateDocumentActivityEmailHTML({
          userName: data.userName,
          documentType: data.documentType,
          activityType: data.activityType,
          portalUrl: data.portalUrl || portalUrl
      });
  }

  if (html) {
      await transportSendEmail({
          to,
          subject,
          html
      });
  } else {
      console.warn(`No template found for ${template}, email not sent to ${to}`);
  }
  
  return { success: true, messageId: `real-${Date.now()}` };
}