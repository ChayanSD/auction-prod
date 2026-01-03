import PDFDocument from "pdfkit";

// Helper function to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Helper function to format date
const formatDate = (dateString: string | Date) => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return 'Invalid date';
  }
};

interface InvoiceData {
  invoice: {
    id: string;
    invoiceNumber: string;
    bidAmount: number;
    additionalFee: number | null;
    totalAmount: number;
    status: 'Unpaid' | 'Paid' | 'Cancelled';
    createdAt: Date | string;
    paidAt: Date | string | null;
    notes: string | null;
    auctionItem: {
      id: string;
      name: string;
      lotCount?: number | null;
      startDate: Date | string;
      endDate: Date | string;
      auction: {
        id: string;
        name: string;
        endDate?: Date | string | null;
      };
    };
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
    };
  };
  winningBid?: {
    id: string;
    amount: number;
    createdAt: Date | string;
  } | null;
}

/**
 * Generate PDF invoice buffer
 * Based on the invoice format shown in screenshots
 */
export async function generateInvoicePDF(invoiceData: InvoiceData): Promise<Buffer> {
  const { invoice, winningBid } = invoiceData;

  // Create a new PDF document
  const doc = new PDFDocument({
    size: 'A4',
    margin: 50,
  });

  const chunks: Buffer[] = [];
  doc.on('data', (chunk) => chunks.push(chunk));

  let yPos = 50;

  // Header - Invoice Number and Date (Right aligned)
  doc.fontSize(20).fillColor('#000000').text('INVOICE', 50, yPos, { align: 'right' });
  doc.fontSize(10).fillColor('#333333');
  doc.text(`Invoice Number: ${invoice.invoiceNumber}`, 50, yPos + 25, { align: 'right' });
  doc.text(`Invoice Date: ${formatDate(invoice.createdAt)}`, 50, yPos + 40, { align: 'right' });
  
  // Company Information (Left side)
  const companyName = process.env.COMPANY_NAME || 'Super Media Bros';
  const companyAddress = process.env.COMPANY_ADDRESS || 'N/A';
  const companyCity = process.env.COMPANY_CITY || 'N/A';
  const companyPostcode = process.env.COMPANY_POSTCODE || 'N/A';
  const companyCountry = process.env.COMPANY_COUNTRY || 'United Kingdom';
  const companyPhone = process.env.COMPANY_PHONE || 'N/A';
  const companyEmail = process.env.APP_EMAIL || process.env.SMTP_USER || 'N/A';
  const companyVAT = process.env.COMPANY_VAT || 'N/A';
  const companyNumber = process.env.COMPANY_NUMBER || 'N/A';

  doc.fontSize(12).fillColor('#000000').text(companyName, 50, yPos);
  doc.fontSize(10).fillColor('#333333');
  doc.text(companyAddress, 50, yPos + 15);
  doc.text(`${companyCity}, ${companyPostcode}`, 50, yPos + 30);
  doc.text(companyCountry, 50, yPos + 45);
  doc.text(`Tel: ${companyPhone}`, 50, yPos + 60);
  doc.text(`Email: ${companyEmail}`, 50, yPos + 75);
  doc.text(`VAT NO: ${companyVAT}`, 50, yPos + 90);
  doc.text(`Company Number: ${companyNumber}`, 50, yPos + 105);
  
  yPos += 130;

  // Buyer Information
  doc.fontSize(12).fillColor('#000000').text('Bill To:', 50, yPos);
  yPos += 15;
  doc.fontSize(10).fillColor('#333333');
  doc.text(`${invoice.user.firstName} ${invoice.user.lastName}`, 50, yPos);
  doc.text(invoice.user.email, 50, yPos + 15);
  if (invoice.user.phone) {
    doc.text(invoice.user.phone, 50, yPos + 30);
  }
  yPos += 50;

  // Auction Details
  doc.fontSize(12).fillColor('#000000').text('Auction Details:', 50, yPos);
  yPos += 15;
  doc.fontSize(10).fillColor('#333333');
  doc.text(`Auction: ${invoice.auctionItem.auction.name}`, 50, yPos);
  doc.text(`Auction Date: ${formatDate(invoice.auctionItem.auction.endDate || invoice.auctionItem.endDate)}`, 50, yPos + 15);
  yPos += 40;

  // Item Details
  doc.fontSize(12).fillColor('#000000').text('Item Details:', 50, yPos);
  yPos += 15;
  doc.fontSize(10).fillColor('#333333');
  doc.text(`Lot No: ${invoice.auctionItem.lotCount || 'N/A'}`, 50, yPos);
  doc.text(`Description: ${invoice.auctionItem.name}`, 50, yPos + 15, { width: 500 });
  yPos += 40;

  // Payment Summary Table
  doc.fontSize(12).fillColor('#000000').text('Payment Summary', 50, yPos);
  yPos += 20;

  const tableTop = yPos;
  const itemCol = 50;
  const amountCol = 450;

  // Table Header
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000');
  doc.text('Description', itemCol, tableTop);
  doc.text('Amount', amountCol, tableTop, { align: 'right' });
  doc.font('Helvetica');
  yPos += 20;

  // Table Rows
  doc.fontSize(10).fillColor('#333333');
  doc.text('Hammer (Winning Bid)', itemCol, yPos);
  doc.text(formatCurrency(invoice.bidAmount), amountCol, yPos, { align: 'right' });
  yPos += 15;

  if (invoice.additionalFee && invoice.additionalFee > 0) {
    doc.text('Buyer\'s Premium', itemCol, yPos);
    doc.text(formatCurrency(invoice.additionalFee), amountCol, yPos, { align: 'right' });
    yPos += 15;
  }

  // Separator line
  doc.lineWidth(0.5).strokeColor('#cccccc').moveTo(itemCol, yPos + 5).lineTo(550, yPos + 5).stroke();
  yPos += 15;

  // Total
  doc.fontSize(12).font('Helvetica-Bold').fillColor('#000000');
  doc.text('Invoice Total', itemCol, yPos);
  doc.text(formatCurrency(invoice.totalAmount), amountCol, yPos, { align: 'right' });
  doc.font('Helvetica');
  yPos += 20;

  // Balance Due (same as total if unpaid)
  if (invoice.status === 'Unpaid') {
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#000000');
    doc.text('Balance Due', itemCol, yPos);
    doc.text(formatCurrency(invoice.totalAmount), amountCol, yPos, { align: 'right' });
    doc.font('Helvetica');
    yPos += 30;
  }

  // Status (Large and Bold if Unpaid)
  if (invoice.status === 'Unpaid') {
    doc.fontSize(24).font('Helvetica-Bold').fillColor('#FF0000');
    doc.text('UNPAID', 50, yPos);
    doc.font('Helvetica').fontSize(10).fillColor('#333333');
    yPos += 40;
  } else if (invoice.status === 'Paid') {
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#28a745');
    doc.text('PAID', 50, yPos);
    if (invoice.paidAt) {
      doc.font('Helvetica').fontSize(10).fillColor('#333333');
      doc.text(`Paid At: ${formatDate(invoice.paidAt)}`, 50, yPos + 20);
    }
    yPos += 40;
  }

  // Notes Section
  if (invoice.notes) {
    doc.fontSize(12).fillColor('#000000').text('Notes:', 50, yPos);
    yPos += 15;
    doc.fontSize(10).fillColor('#666666').text(invoice.notes, 50, yPos, { width: 500 });
    yPos += 40;
  }

  // Payment Instructions (if unpaid)
  if (invoice.status === 'Unpaid') {
    doc.fontSize(10).fillColor('#333333');
    doc.text('Payment Instructions:', 50, yPos);
    yPos += 15;
    doc.text('Please complete your payment within 7 days to secure your purchase.', 50, yPos, { width: 500 });
    yPos += 20;
    doc.text('If you have any questions, please contact our support team.', 50, yPos, { width: 500 });
    yPos += 30;
  }

  // Footer
  const pageHeight = doc.page.height;
  const footerY = pageHeight - 80;
  doc.fontSize(8).fillColor('#999999');
  doc.text('This is an official invoice document.', 50, footerY, { align: 'center', width: 500 });
  doc.text('Thank you for your business!', 50, footerY + 15, { align: 'center', width: 500 });

  // Wait for PDF to be generated before ending
  return new Promise<Buffer>((resolve, reject) => {
    // Set up event listeners BEFORE calling end()
    doc.on('end', () => {
      const buffer = Buffer.concat(chunks);
      console.log(`PDF generated successfully. Size: ${buffer.length} bytes`);
      resolve(buffer);
    });
    
    doc.on('error', (error) => {
      console.error('PDF generation error:', error);
      reject(error);
    });

    // Finalize PDF - this triggers the 'end' event
    doc.end();
  });
}

