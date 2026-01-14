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
  lotNumber?: string | null;
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
    fontSize: 22,
    fontStyle: 'bold',
    align: 'right',
  });
  yPos += 10;
  addText(`Invoice #${invoice.invoiceNumber}`, pageWidth - margin, yPos, {
    fontSize: 10,
    align: 'right',
    color: '#666666',
  });
  yPos += 5;
  addText(`Date: ${formatDate(invoice.createdAt)}`, pageWidth - margin, yPos, {
    fontSize: 10,
    align: 'right',
    color: '#666666',
  });
  yPos += 15;

  // Company Information (left side)
  addText(companyName, margin, margin + 2, {
    fontSize: 13,
    fontStyle: 'bold',
  });
  let companyY = margin + 9;
  
  if (companyAddress && companyAddress !== 'N/A') {
    addText(companyAddress, margin, companyY, { fontSize: 9, color: '#333333' });
    companyY += 4.5;
  }
  if ((companyCity && companyCity !== 'N/A') || (companyPostcode && companyPostcode !== 'N/A')) {
    const cityPostcode = [
      companyCity !== 'N/A' ? companyCity : '', 
      companyPostcode !== 'N/A' ? companyPostcode : ''
    ].filter(Boolean).join(', ');
    if (cityPostcode) {
      addText(cityPostcode, margin, companyY, { fontSize: 9, color: '#333333' });
      companyY += 4.5;
    }
  }
  if (companyCountry && companyCountry !== 'N/A') {
    addText(companyCountry, margin, companyY, { fontSize: 9, color: '#333333' });
    companyY += 4.5;
  }
  if (companyPhone && companyPhone !== 'N/A') {
    addText(`Tel: ${companyPhone}`, margin, companyY, { fontSize: 9, color: '#333333' });
    companyY += 4.5;
  }
  if (companyEmail) {
    addText(`Email: ${companyEmail}`, margin, companyY, { fontSize: 9, color: '#333333' });
    companyY += 4.5;
  }
  if (companyVAT && companyVAT !== 'N/A') {
    addText(`VAT: ${companyVAT}`, margin, companyY, { fontSize: 9, color: '#333333' });
    companyY += 4.5;
  }
  if (companyNumber && companyNumber !== 'N/A') {
    addText(`Company No: ${companyNumber}`, margin, companyY, { fontSize: 9, color: '#333333' });
    companyY += 4.5;
  }

  yPos = Math.max(yPos, companyY + 12);

  // Horizontal separator
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  // Bill To section
  addText('BILL TO', margin, yPos, {
    fontSize: 11,
    fontStyle: 'bold',
  });
  yPos += 7;
  addText(`${invoice.user.firstName} ${invoice.user.lastName}`, margin, yPos, { 
    fontSize: 10,
    color: '#333333'
  });
  yPos += 5;
  addText(invoice.user.email, margin, yPos, { fontSize: 9, color: '#666666' });
  yPos += 5;
  if (invoice.user.phone) {
    addText(invoice.user.phone, margin, yPos, { fontSize: 9, color: '#666666' });
    yPos += 5;
  }
  
  // Shipping Address
  if (invoice.shippingAddress) {
    yPos += 2;
    addText(invoice.shippingAddress.address1, margin, yPos, { fontSize: 9, color: '#666666' });
    yPos += 4.5;
    if (invoice.shippingAddress.address2) {
      addText(invoice.shippingAddress.address2, margin, yPos, { fontSize: 9, color: '#666666' });
      yPos += 4.5;
    }
    const cityPostcode = [invoice.shippingAddress.city, invoice.shippingAddress.postcode]
      .filter(Boolean).join(', ');
    if (cityPostcode) {
      addText(cityPostcode, margin, yPos, { fontSize: 9, color: '#666666' });
      yPos += 4.5;
    }
    if (invoice.shippingAddress.country) {
      addText(invoice.shippingAddress.country, margin, yPos, { fontSize: 9, color: '#666666' });
      yPos += 4.5;
    }
  }
  
  yPos += 10;

  // Auction Details
  addText('AUCTION DETAILS', margin, yPos, {
    fontSize: 11,
    fontStyle: 'bold',
  });
  yPos += 7;
  const auctionName = invoice.auction?.name || invoice.auctionItem?.auction?.name || 'N/A';
  addText(`Auction: ${auctionName}`, margin, yPos, { fontSize: 9, color: '#333333' });
  yPos += 5;
  const auctionDate = invoice.auction?.endDate || invoice.auctionItem?.auction?.endDate || invoice.auctionItem?.endDate;
  if (auctionDate) {
    addText(`Date: ${formatDate(auctionDate)}`, margin, yPos, { fontSize: 9, color: '#333333' });
    yPos += 5;
  }
  yPos += 8;

  // Item Details - Different for single vs multi-item
  if (isMultiItem) {
    // Multi-item invoice: Show items table
    addText('ITEMS WON', margin, yPos, {
      fontSize: 11,
      fontStyle: 'bold',
    });
    yPos += 10;

    const tableLeft = margin;
    const tableRight = pageWidth - margin;
    const tableWidth = tableRight - tableLeft;
    const col0Width = tableWidth * 0.1; // Lot #
    const col1Width = tableWidth * 0.3; // Item name
    const col2Width = tableWidth * 0.15; // Bid
    const col3Width = tableWidth * 0.15; // Premium
    const col4Width = tableWidth * 0.15; // Tax
    const col5Width = tableWidth * 0.15; // Total

    // Table header
    doc.setFillColor(245, 245, 245);
    doc.rect(tableLeft, yPos - 5, tableWidth, 7, 'F');
    doc.setDrawColor(220, 220, 220);
    doc.line(tableLeft, yPos + 2, tableRight, yPos + 2);
    
    // Define exact column boundaries
    const col0End = tableLeft + col0Width;
    const col1End = col0End + 2 + col1Width; // 2mm gap + column width
    const col2End = col1End + 2 + col2Width;
    const col3End = col2End + 2 + col3Width;
    const col4End = col3End + 2 + col4Width;
    const col5End = tableRight;
    
    addText('Lot #', tableLeft + 2, yPos, { fontSize: 9, fontStyle: 'bold', color: '#333333', maxWidth: col0Width - 4 });
    addText('Item', col0End + 2, yPos, { fontSize: 9, fontStyle: 'bold', color: '#333333', maxWidth: col1Width - 6 });
    addText('Bid', col2End - 2, yPos, { fontSize: 9, fontStyle: 'bold', align: 'right', color: '#333333', maxWidth: col2Width - 4 });
    addText('Premium', col3End - 2, yPos, { fontSize: 9, fontStyle: 'bold', align: 'right', color: '#333333', maxWidth: col3Width - 4 });
    addText('Tax', col4End - 2, yPos, { fontSize: 9, fontStyle: 'bold', align: 'right', color: '#333333', maxWidth: col4Width - 4 });
    addText('Total', col5End - 2, yPos, { fontSize: 9, fontStyle: 'bold', align: 'right', color: '#333333', maxWidth: col5Width - 4 });
    yPos += 8;

    // Table rows for each item
    for (const lineItem of lineItems!) {
      // Check if we need a new page
      if (yPos > pageHeight - 50) {
        doc.addPage();
        yPos = margin;
      }

      // Calculate column boundaries (same as header)
      const col0End = tableLeft + col0Width;
      const col1End = col0End + 2 + col1Width; // 2mm gap + column width
      const col2End = col1End + 2 + col2Width;
      const col3End = col2End + 2 + col3Width;
      const col4End = col3End + 2 + col4Width;
      const col5End = tableRight;

      // Split item name into multiple lines if needed - ensure it stays within column 1
      const itemNameMaxWidth = col1Width - 6; // More padding to prevent overflow (3mm on each side)
      const itemNameLines = doc.splitTextToSize(lineItem.itemName, itemNameMaxWidth);
      const lineHeight = 4.5; // Height per line
      const itemNameHeight = itemNameLines.length * lineHeight;
      const minRowHeight = 8; // Minimum row height for single line items
      const rowHeight = Math.max(itemNameHeight, minRowHeight);

      // Lot number - in column 0
      const lotNumberText = lineItem.lotNumber || '—';
      addText(lotNumberText, tableLeft + 2, yPos + 4, {
        fontSize: 9,
        color: '#333333',
        maxWidth: col0Width - 4,
      });

      // Item name (may wrap to multiple lines) - strictly contained in column 1
      // Using addText helper which properly handles wrapping and boundaries
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor('#333333');
      // Draw each line separately to ensure proper positioning
      let lineY = yPos + 4;
      itemNameLines.forEach((line: string) => {
        doc.text(line, col0End + 3, lineY);
        lineY += lineHeight;
      });
      
      // Amounts - aligned to top (first line) of item name, using exact column boundaries
      const amountYPos = yPos + 4;
      
      // Bid amount - right aligned within column 2 boundaries
      addText(formatCurrency(lineItem.bidAmount), col2End - 2, amountYPos, {
        fontSize: 9,
        align: 'right',
        color: '#333333',
        maxWidth: col2Width - 4,
      });
      
      // Premium amount - right aligned within column 3 boundaries
      addText(formatCurrency(lineItem.buyersPremium), col3End - 2, amountYPos, {
        fontSize: 9,
        align: 'right',
        color: '#333333',
        maxWidth: col3Width - 4,
      });
      
      // Tax amount - right aligned within column 4 boundaries
      addText(formatCurrency(lineItem.taxAmount), col4End - 2, amountYPos, {
        fontSize: 9,
        align: 'right',
        color: '#333333',
        maxWidth: col4Width - 4,
      });
      
      // Total amount - right aligned within column 5 boundaries
      addText(formatCurrency(lineItem.lineTotal), col5End - 2, amountYPos, {
        fontSize: 9,
        align: 'right',
        color: '#333333',
        maxWidth: col5Width - 4,
      });

      // Move to next row position based on actual item name height
      yPos += rowHeight + 3; // Add row height plus spacing
      
      // Row separator
      doc.setDrawColor(240, 240, 240);
      doc.line(tableLeft, yPos, tableRight, yPos);
      yPos += 4;
    }
    yPos += 5;
  } else {
    // Single-item invoice (legacy)
    addText('ITEM DETAILS', margin, yPos, {
      fontSize: 11,
      fontStyle: 'bold',
    });
    yPos += 7;
    if (invoice.auctionItem?.lotCount) {
      addText(`Lot Number: ${invoice.auctionItem.lotCount}`, margin, yPos, { fontSize: 9, color: '#333333' });
      yPos += 5;
    }
    if (invoice.auctionItem?.name) {
      const itemDescHeight = addText(`Description: ${invoice.auctionItem.name}`, margin, yPos, {
        fontSize: 9,
        color: '#333333',
        maxWidth: pageWidth - margin * 2,
      });
      yPos += itemDescHeight * 4.5 + 8;
    }
  }

  // Payment Summary Table
  addText('PAYMENT SUMMARY', margin, yPos, {
    fontSize: 11,
    fontStyle: 'bold',
  });
  yPos += 10;

  const tableLeft = margin;
  const tableRight = pageWidth - margin;
  const tableWidth = tableRight - tableLeft;

  // Table header
  doc.setFillColor(245, 245, 245);
  doc.rect(tableLeft, yPos - 5, tableWidth, 7, 'F');
  doc.setDrawColor(220, 220, 220);
  doc.line(tableLeft, yPos + 2, tableRight, yPos + 2);
  
  addText('Description', tableLeft + 2, yPos, { fontSize: 9, fontStyle: 'bold', color: '#333333' });
  addText('Amount', tableRight - 2, yPos, { fontSize: 9, fontStyle: 'bold', align: 'right', color: '#333333' });
  yPos += 8;

  if (isMultiItem) {
    // For multi-item: show subtotal
    const subtotal = invoice.subtotal || invoice.totalAmount;
    addText('Subtotal', tableLeft + 2, yPos, { fontSize: 9, color: '#333333' });
    addText(formatCurrency(subtotal), tableRight - 2, yPos, {
      fontSize: 9,
      align: 'right',
      color: '#333333',
    });
    yPos += 6;
  } else {
    // Legacy single-item breakdown
    if (invoice.bidAmount !== undefined) {
      addText('Hammer (Winning Bid)', tableLeft + 2, yPos, { fontSize: 9, color: '#333333' });
      addText(formatCurrency(invoice.bidAmount), tableRight - 2, yPos, {
        fontSize: 9,
        align: 'right',
        color: '#333333',
      });
      yPos += 6;
    }

    if (invoice.buyersPremium && invoice.buyersPremium > 0) {
      addText('Buyer\'s Premium', tableLeft + 2, yPos, { fontSize: 9, color: '#333333' });
      addText(formatCurrency(invoice.buyersPremium), tableRight - 2, yPos, {
        fontSize: 9,
        align: 'right',
        color: '#333333',
      });
      yPos += 6;
    }

    if (invoice.taxAmount && invoice.taxAmount > 0) {
      addText('Tax', tableLeft + 2, yPos, { fontSize: 9, color: '#333333' });
      addText(formatCurrency(invoice.taxAmount), tableRight - 2, yPos, {
        fontSize: 9,
        align: 'right',
        color: '#333333',
      });
      yPos += 6;
    }
  }

  // Separator line
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.5);
  doc.line(tableLeft, yPos + 2, tableRight, yPos + 2);
  yPos += 7;

  // Total row with background
  doc.setFillColor(245, 245, 245);
  doc.rect(tableLeft, yPos - 5, tableWidth, 8, 'F');
  
  addText('Invoice Total', tableLeft + 2, yPos, {
    fontSize: 11,
    fontStyle: 'bold',
    color: '#000000',
  });
  addText(formatCurrency(invoice.totalAmount), tableRight - 2, yPos, {
    fontSize: 11,
    fontStyle: 'bold',
    align: 'right',
    color: '#000000',
  });
  yPos += 12;

  // Balance Due (if unpaid) - Plain text only
  if (invoice.status === 'Unpaid') {
    addText('Balance Due', tableLeft + 2, yPos, {
      fontSize: 11,
      fontStyle: 'bold',
      color: '#000000',
    });
    addText(formatCurrency(invoice.totalAmount), tableRight - 2, yPos, {
      fontSize: 11,
      fontStyle: 'bold',
      color: '#000000',
      align: 'right',
    });
    yPos += 15;
  }

  // Status Badge - Plain text only
  yPos += 5;
  if (invoice.status === 'Unpaid') {
    addText('Status: UNPAID', margin, yPos, {
      fontSize: 11,
      fontStyle: 'bold',
      color: '#000000',
    });
    yPos += 8;
  } else if (invoice.status === 'Paid') {
    addText('Status: PAID', margin, yPos, {
      fontSize: 11,
      fontStyle: 'bold',
      color: '#000000',
    });
    yPos += 8;
    if (invoice.paidAt) {
      addText(`Paid: ${formatDate(invoice.paidAt)}`, margin, yPos, { 
        fontSize: 9, 
        color: '#666666' 
      });
      yPos += 5;
    }
    yPos += 10;
  }

  // Notes
  if (invoice.notes) {
    yPos += 5;
    addText('Notes:', margin, yPos, {
      fontSize: 10,
      fontStyle: 'bold',
    });
    yPos += 6;
    const notesHeight = addText(invoice.notes, margin, yPos, {
      fontSize: 9,
      color: '#666666',
      maxWidth: pageWidth - margin * 2,
    });
    yPos += notesHeight * 4.5 + 10;
  }

  // Payment Instructions (if unpaid)
  if (invoice.status === 'Unpaid') {
    yPos += 5;
    addText('Payment Instructions', margin, yPos, { 
      fontSize: 10, 
      fontStyle: 'bold' 
    });
    yPos += 6;
    const inst1Height = addText(
      'Please complete your payment within 7 days to secure your purchase.',
      margin,
      yPos,
      { fontSize: 9, color: '#666666', maxWidth: pageWidth - margin * 2 }
    );
    yPos += inst1Height * 4.5 + 4;
    const inst2Height = addText(
      'If you have any questions, please contact our support team.',
      margin,
      yPos,
      { fontSize: 9, color: '#666666', maxWidth: pageWidth - margin * 2 }
    );
    yPos += inst2Height * 4.5 + 10;
  }

  // Footer - Only if there's enough space (at least 15mm from bottom)
  if (yPos < pageHeight - 25) {
    const footerY = pageHeight - 15;
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
    
    addText('Thank you for your business!', pageWidth / 2, footerY, {
      fontSize: 9,
      color: '#999999',
      align: 'center',
    });
  }

  // Convert to buffer
  const pdfOutput = doc.output('arraybuffer');
  const buffer = Buffer.from(pdfOutput);
  console.log(`PDF generated successfully. Size: ${buffer.length} bytes`);
  
  return buffer;
}