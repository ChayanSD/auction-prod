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

interface InvoiceLineItem {
  id: string;
  auctionItemId: string;
  itemName: string;
  bidAmount: number;
  buyersPremium: number;
  taxAmount: number;
  lineTotal: number;
}

interface InvoiceData {
  invoice: {
    id: string;
    invoiceNumber: string;
    // Legacy fields (for single-item invoices)
    bidAmount?: number;
    buyersPremium?: number;
    taxAmount?: number;
    totalAmount: number;
    subtotal?: number;
    status: 'Unpaid' | 'Paid' | 'Cancelled';
    createdAt: Date | string;
    paidAt: Date | string | null;
    notes: string | null;
    // Legacy: single item
    auctionItem?: {
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
    // New: auction info (for combined invoices)
    auction?: {
      id: string;
      name: string;
      endDate?: Date | string | null;
    };
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
    };
    shippingAddress?: {
      address1: string;
      address2?: string | null;
      city: string;
      postcode: string;
      country: string;
    } | null;
  };
  // New: line items for combined invoices
  lineItems?: InvoiceLineItem[];
  // Legacy: winning bid for single-item invoices
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
  const { invoice, lineItems } = invoiceData;
  const isMultiItem = lineItems && lineItems.length > 0;

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
  
  // Shipping Address
  if (invoice.shippingAddress) {
    yPos += 3;
    addText(invoice.shippingAddress.address1, margin, yPos, { fontSize: 10 });
    yPos += 5;
    if (invoice.shippingAddress.address2) {
      addText(invoice.shippingAddress.address2, margin, yPos, { fontSize: 10 });
      yPos += 5;
    }
    const cityPostcode = [invoice.shippingAddress.city, invoice.shippingAddress.postcode].filter(Boolean).join(', ');
    if (cityPostcode) {
      addText(cityPostcode, margin, yPos, { fontSize: 10 });
      yPos += 5;
    }
    if (invoice.shippingAddress.country) {
      addText(invoice.shippingAddress.country, margin, yPos, { fontSize: 10 });
      yPos += 5;
    }
  }
  
  yPos += 10;

  // Auction Details
  addText('Auction Details:', margin, yPos, {
    fontSize: 12,
    fontStyle: 'bold',
  });
  yPos += 7;
  const auctionName = invoice.auction?.name || invoice.auctionItem?.auction?.name || 'N/A';
  addText(`Auction: ${auctionName}`, margin, yPos, { fontSize: 10 });
  yPos += 5;
  const auctionDate = invoice.auction?.endDate || invoice.auctionItem?.auction?.endDate || invoice.auctionItem?.endDate;
  if (auctionDate) {
    addText(`Auction Date: ${formatDate(auctionDate)}`, margin, yPos, { fontSize: 10 });
    yPos += 5;
  }
  yPos += 5;

  // Item Details - Different for single vs multi-item
  if (isMultiItem) {
    // Multi-item invoice: Show items table
    addText('Items Won:', margin, yPos, {
      fontSize: 12,
      fontStyle: 'bold',
    });
    yPos += 10;

    const tableLeft = margin;
    const tableRight = pageWidth - margin;
    const tableWidth = tableRight - tableLeft;
    const col1Width = tableWidth * 0.4; // Item name
    const col2Width = tableWidth * 0.15; // Bid
    const col3Width = tableWidth * 0.15; // Premium
    const col4Width = tableWidth * 0.15; // Tax
    const col5Width = tableWidth * 0.15; // Total

    // Table header
    doc.setFillColor(240, 240, 240);
    doc.rect(tableLeft, yPos - 5, tableWidth, 8, 'F');
    addText('Item', tableLeft + 2, yPos, { fontSize: 9, fontStyle: 'bold' });
    addText('Bid', tableLeft + col1Width + 2, yPos, { fontSize: 9, fontStyle: 'bold', align: 'right' });
    addText('Premium', tableLeft + col1Width + col2Width + 2, yPos, { fontSize: 9, fontStyle: 'bold', align: 'right' });
    addText('Tax', tableLeft + col1Width + col2Width + col3Width + 2, yPos, { fontSize: 9, fontStyle: 'bold', align: 'right' });
    addText('Total', tableRight - 2, yPos, { fontSize: 9, fontStyle: 'bold', align: 'right' });
    yPos += 8;

    // Table rows for each item
    for (const lineItem of lineItems!) {
      // Check if we need a new page
      if (yPos > pageHeight - 40) {
        doc.addPage();
        yPos = margin;
      }

      const itemNameLines = doc.splitTextToSize(lineItem.itemName, col1Width - 4);
      const itemNameHeight = itemNameLines.length * 3.5;

      // Item name (may wrap)
      doc.setFontSize(9);
      doc.text(itemNameLines, tableLeft + 2, yPos);
      
      // Bid amount
      addText(formatCurrency(lineItem.bidAmount), tableLeft + col1Width + 2, yPos, {
        fontSize: 9,
        align: 'right',
      });
      
      // Premium
      addText(formatCurrency(lineItem.buyersPremium), tableLeft + col1Width + col2Width + 2, yPos, {
        fontSize: 9,
        align: 'right',
      });
      
      // Tax
      addText(formatCurrency(lineItem.taxAmount), tableLeft + col1Width + col2Width + col3Width + 2, yPos, {
        fontSize: 9,
        align: 'right',
      });
      
      // Line total
      addText(formatCurrency(lineItem.lineTotal), tableRight - 2, yPos, {
        fontSize: 9,
        align: 'right',
      });

      yPos += Math.max(itemNameHeight, 7);
      
      // Row separator
      doc.setDrawColor(200, 200, 200);
      doc.line(tableLeft, yPos - 2, tableRight, yPos - 2);
      yPos += 3;
    }
    yPos += 5;
  } else {
    // Single-item invoice (legacy)
    addText('Item Details:', margin, yPos, {
      fontSize: 12,
      fontStyle: 'bold',
    });
    yPos += 7;
    if (invoice.auctionItem?.lotCount) {
      addText(`Lot No: ${invoice.auctionItem.lotCount}`, margin, yPos, { fontSize: 10 });
      yPos += 5;
    }
    if (invoice.auctionItem?.name) {
      const itemDescHeight = addText(`Description: ${invoice.auctionItem.name}`, margin, yPos, {
        fontSize: 10,
        maxWidth: pageWidth - margin * 2,
      });
      yPos += itemDescHeight * 5 + 5;
    }
  }

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

  if (isMultiItem) {
    // For multi-item: show subtotal
    const subtotal = invoice.subtotal || invoice.totalAmount;
    addText('Subtotal', tableLeft + 2, yPos, { fontSize: 10 });
    addText(formatCurrency(subtotal), tableRight - 2, yPos, {
      fontSize: 10,
      align: 'right',
    });
    yPos += 7;
  } else {
    // Legacy single-item breakdown
    if (invoice.bidAmount !== undefined) {
      addText('Hammer (Winning Bid)', tableLeft + 2, yPos, { fontSize: 10 });
      addText(formatCurrency(invoice.bidAmount), tableRight - 2, yPos, {
        fontSize: 10,
        align: 'right',
      });
      yPos += 7;
    }

    if (invoice.buyersPremium && invoice.buyersPremium > 0) {
      addText('Buyer\'s Premium', tableLeft + 2, yPos, { fontSize: 10 });
      addText(formatCurrency(invoice.buyersPremium), tableRight - 2, yPos, {
        fontSize: 10,
        align: 'right',
      });
      yPos += 7;
    }

    if (invoice.taxAmount && invoice.taxAmount > 0) {
      addText('Tax', tableLeft + 2, yPos, { fontSize: 10 });
      addText(formatCurrency(invoice.taxAmount), tableRight - 2, yPos, {
        fontSize: 10,
        align: 'right',
      });
      yPos += 7;
    }
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
