import { jsPDF } from 'jspdf';

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
 * Generate PDF invoice buffer using jsPDF
 * Serverless-friendly PDF generation
 */
export async function generateInvoicePDF(invoiceData: InvoiceData): Promise<Buffer> {
  const { invoice } = invoiceData;

  // Company Information
  // Use environment variables if available, otherwise use sensible defaults
  const companyName = process.env.COMPANY_NAME || 'Super Media Bros';
  const companyAddress = process.env.COMPANY_ADDRESS || '';
  const companyCity = process.env.COMPANY_CITY || '';
  const companyPostcode = process.env.COMPANY_POSTCODE || '';
  const companyCountry = process.env.COMPANY_COUNTRY || 'United Kingdom';
  const companyPhone = process.env.COMPANY_PHONE || '';
  const companyEmail = process.env.APP_EMAIL || process.env.SMTP_USER || '';
  const companyVAT = process.env.COMPANY_VAT || '';
  const companyNumber = process.env.COMPANY_NUMBER || '';

  // Create PDF document (A4 size, portrait)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = margin;

  // Helper function to add text with word wrap
  const addText = (text: string, x: number, y: number, options: {
    fontSize?: number;
    fontStyle?: 'normal' | 'bold';
    color?: string;
    align?: 'left' | 'center' | 'right';
    maxWidth?: number;
  } = {}) => {
    const {
      fontSize = 10,
      fontStyle = 'normal',
      color = '#000000',
      align = 'left',
      maxWidth = pageWidth - margin * 2,
    } = options;

    doc.setFontSize(fontSize);
    doc.setFont('helvetica', fontStyle);
    doc.setTextColor(color);

    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, x, y, { align });
    return lines.length * (fontSize * 0.35); // Approximate line height
  };

  // Header - Invoice title (right aligned)
  addText('INVOICE', pageWidth - margin, yPos, {
    fontSize: 20,
    fontStyle: 'bold',
    align: 'right',
  });
  yPos += 8;
  addText(`Invoice Number: ${invoice.invoiceNumber}`, pageWidth - margin, yPos, {
    fontSize: 10,
    align: 'right',
  });
  yPos += 5;
  addText(`Invoice Date: ${formatDate(invoice.createdAt)}`, pageWidth - margin, yPos, {
    fontSize: 10,
    align: 'right',
  });
  yPos += 15;

  // Company Information (left side)
  addText(companyName, margin, margin, {
    fontSize: 12,
    fontStyle: 'bold',
  });
  let companyY = margin + 5;
  if (companyAddress) {
    addText(companyAddress, margin, companyY, { fontSize: 10 });
    companyY += 5;
  }
  if (companyCity || companyPostcode) {
    const cityPostcode = [companyCity, companyPostcode].filter(Boolean).join(', ');
    if (cityPostcode) {
      addText(cityPostcode, margin, companyY, { fontSize: 10 });
      companyY += 5;
    }
  }
  if (companyCountry) {
    addText(companyCountry, margin, companyY, { fontSize: 10 });
    companyY += 5;
  }
  if (companyPhone) {
    addText(`Tel: ${companyPhone}`, margin, companyY, { fontSize: 10 });
    companyY += 5;
  }
  if (companyEmail) {
    addText(`Email: ${companyEmail}`, margin, companyY, { fontSize: 10 });
    companyY += 5;
  }
  if (companyVAT) {
    addText(`VAT NO: ${companyVAT}`, margin, companyY, { fontSize: 10 });
    companyY += 5;
  }
  if (companyNumber) {
    addText(`Company Number: ${companyNumber}`, margin, companyY, { fontSize: 10 });
    companyY += 5;
  }

  yPos = Math.max(yPos, companyY + 10);

  // Bill To section
  addText('Bill To:', margin, yPos, {
    fontSize: 12,
    fontStyle: 'bold',
  });
  yPos += 7;
  addText(`${invoice.user.firstName} ${invoice.user.lastName}`, margin, yPos, { fontSize: 10 });
  yPos += 5;
  addText(invoice.user.email, margin, yPos, { fontSize: 10 });
  yPos += 5;
  if (invoice.user.phone) {
    addText(invoice.user.phone, margin, yPos, { fontSize: 10 });
    yPos += 5;
  }
  yPos += 10;

  // Auction Details
  addText('Auction Details:', margin, yPos, {
    fontSize: 12,
    fontStyle: 'bold',
  });
  yPos += 7;
  addText(`Auction: ${invoice.auctionItem.auction.name}`, margin, yPos, { fontSize: 10 });
  yPos += 5;
  addText(
    `Auction Date: ${formatDate(invoice.auctionItem.auction.endDate || invoice.auctionItem.endDate)}`,
    margin,
    yPos,
    { fontSize: 10 }
  );
  yPos += 10;

  // Item Details
  addText('Item Details:', margin, yPos, {
    fontSize: 12,
    fontStyle: 'bold',
  });
  yPos += 7;
  // Only show Lot No if it exists
  if (invoice.auctionItem.lotCount) {
    addText(`Lot No: ${invoice.auctionItem.lotCount}`, margin, yPos, { fontSize: 10 });
    yPos += 5;
  }
  const itemDescHeight = addText(`Description: ${invoice.auctionItem.name}`, margin, yPos, {
    fontSize: 10,
    maxWidth: pageWidth - margin * 2,
  });
  yPos += itemDescHeight * 5 + 5;

  // Payment Summary Table
  addText('Payment Summary', margin, yPos, {
    fontSize: 12,
    fontStyle: 'bold',
  });
  yPos += 10;

  const tableLeft = margin;
  const tableRight = pageWidth - margin;
  const tableWidth = tableRight - tableLeft;

  // Table header
  doc.setFillColor(240, 240, 240);
  doc.rect(tableLeft, yPos - 5, tableWidth, 8, 'F');
  addText('Description', tableLeft + 2, yPos, { fontSize: 11, fontStyle: 'bold' });
  addText('Amount', tableRight - 2, yPos, { fontSize: 11, fontStyle: 'bold', align: 'right' });
  yPos += 8;

  // Table rows
  addText('Hammer (Winning Bid)', tableLeft + 2, yPos, { fontSize: 10 });
  addText(formatCurrency(invoice.bidAmount), tableRight - 2, yPos, {
    fontSize: 10,
    align: 'right',
  });
  yPos += 7;

  if (invoice.additionalFee && invoice.additionalFee > 0) {
    addText('Buyer\'s Premium', tableLeft + 2, yPos, { fontSize: 10 });
    addText(formatCurrency(invoice.additionalFee), tableRight - 2, yPos, {
      fontSize: 10,
      align: 'right',
    });
    yPos += 7;
  }

  // Separator line
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(tableLeft, yPos + 2, tableRight, yPos + 2);
  yPos += 5;

  // Total row
  addText('Invoice Total', tableLeft + 2, yPos, {
    fontSize: 13,
    fontStyle: 'bold',
  });
  addText(formatCurrency(invoice.totalAmount), tableRight - 2, yPos, {
    fontSize: 13,
    fontStyle: 'bold',
    align: 'right',
  });
  yPos += 10;

  // Balance Due (if unpaid)
  if (invoice.status === 'Unpaid') {
    addText('Balance Due', tableLeft + 2, yPos, {
      fontSize: 13,
      fontStyle: 'bold',
      color: '#FF0000',
    });
    addText(formatCurrency(invoice.totalAmount), tableRight - 2, yPos, {
      fontSize: 13,
      fontStyle: 'bold',
      color: '#FF0000',
      align: 'right',
    });
    yPos += 15;
  }

  // Status
  if (invoice.status === 'Unpaid') {
    addText('UNPAID', margin, yPos, {
      fontSize: 28,
      fontStyle: 'bold',
      color: '#FF0000',
    });
    yPos += 15;
  } else if (invoice.status === 'Paid') {
    addText('PAID', margin, yPos, {
      fontSize: 14,
      fontStyle: 'bold',
      color: '#28a745',
    });
    yPos += 8;
    if (invoice.paidAt) {
      addText(`Paid At: ${formatDate(invoice.paidAt)}`, margin, yPos, { fontSize: 10 });
      yPos += 5;
    }
    yPos += 10;
  }

  // Notes
  if (invoice.notes) {
    addText('Notes:', margin, yPos, {
      fontSize: 12,
      fontStyle: 'bold',
    });
    yPos += 7;
    const notesHeight = addText(invoice.notes, margin, yPos, {
      fontSize: 10,
      color: '#666666',
      maxWidth: pageWidth - margin * 2,
    });
    yPos += notesHeight * 5 + 10;
  }

  // Payment Instructions (if unpaid)
  if (invoice.status === 'Unpaid') {
    addText('Payment Instructions:', margin, yPos, { fontSize: 10 });
    yPos += 7;
    const inst1Height = addText(
      'Please complete your payment within 7 days to secure your purchase.',
      margin,
      yPos,
      { fontSize: 10, maxWidth: pageWidth - margin * 2 }
    );
    yPos += inst1Height * 5 + 5;
    const inst2Height = addText(
      'If you have any questions, please contact our support team.',
      margin,
      yPos,
      { fontSize: 10, maxWidth: pageWidth - margin * 2 }
    );
    yPos += inst2Height * 5 + 10;
  }

  // Footer
  const footerY = pageHeight - 20;
  addText('This is an official invoice document.', pageWidth / 2, footerY, {
    fontSize: 8,
    color: '#999999',
    align: 'center',
  });
  addText('Thank you for your business!', pageWidth / 2, footerY + 5, {
    fontSize: 8,
    color: '#999999',
    align: 'center',
  });

  // Convert to buffer
  const pdfOutput = doc.output('arraybuffer');
  const buffer = Buffer.from(pdfOutput);
  console.log(`PDF generated successfully. Size: ${buffer.length} bytes`);
  
  return buffer;
}
