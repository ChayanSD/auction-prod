import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface SettlementItem {
  lotNumber: string | null;
  name: string;
  soldPrice: number | null;
  baseBidPrice: number;
  reservePrice: number | null;
  isSold: boolean;
  status: 'sold' | 'unsold' | 'no_bids' | 'below_reserve';
}

interface SettlementData {
  reference: string;
  seller: {
    companyName: string | null;
    firstName: string;
    lastName: string;
    email: string;
    bankName: string | null;
    bankAccount: string | null;
    bankSortCode: string | null;
  };
  totalSales: number;
  commission: number;
  expenses: number;
  netPayout: number;
  currency: string;
  generatedAt: string;
  paidAt: string | null;
  status: string;
  items: SettlementItem[];
  soldItems?: SettlementItem[];
  unsoldItems?: SettlementItem[];
  adjustments?: { type: string; description: string; amount: number }[];
}

export function generateSettlementPDF(settlement: SettlementData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Company Header
  doc.setFillColor(159, 19, 251); // #9F13FB
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('ELEVATE IT AUCTIONS', pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Settlement Statement', pageWidth / 2, 30, { align: 'center' });
  
  // Reset text color
  doc.setTextColor(0, 0, 0);
  
  // Settlement Reference
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`Settlement: ${settlement.reference}`, 14, 55);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Status: ${settlement.status}`, 14, 62);
  doc.text(`Generated: ${new Date(settlement.generatedAt).toLocaleDateString('en-GB')}`, 14, 68);
  if (settlement.paidAt) {
    doc.text(`Paid: ${new Date(settlement.paidAt).toLocaleDateString('en-GB')}`, 14, 74);
  }
  
  // Seller Information
  const sellerName = settlement.seller.companyName || 
    `${settlement.seller.firstName} ${settlement.seller.lastName}`;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Seller Information', 14, 88);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(sellerName, 14, 95);
  doc.text(settlement.seller.email, 14, 101);
  
  // Bank Details
  if (settlement.seller.bankName) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Bank Details', 120, 88);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Bank: ${settlement.seller.bankName}`, 120, 95);
    if (settlement.seller.bankAccount) {
      doc.text(`Account: ${settlement.seller.bankAccount}`, 120, 101);
    }
    if (settlement.seller.bankSortCode) {
      doc.text(`Sort Code: ${settlement.seller.bankSortCode}`, 120, 107);
    }
  }
  
  let currentY = 120;
  
  // SOLD ITEMS Section
  const soldItems = settlement.soldItems || settlement.items.filter(item => item.isSold !== false);
  if (soldItems.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 100, 0);
    doc.text('✓ SOLD ITEMS', 14, currentY);
    doc.setTextColor(0, 0, 0);
    
    const soldTableData = soldItems.map(item => [
      item.lotNumber || 'N/A',
      item.name,
      `£${(item.soldPrice || 0).toFixed(2)}`,
    ]);
    
    autoTable(doc, {
      startY: currentY + 5,
      head: [['Lot #', 'Item Description', 'Hammer Price']],
      body: soldTableData,
      theme: 'striped',
      headStyles: { fillColor: [34, 197, 94], textColor: 255 }, // Green for sold
      styles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 120 },
        2: { cellWidth: 40, halign: 'right' },
      },
    });
    
    currentY = (doc as any).lastAutoTable.finalY + 10;
  }
  
  // UNSOLD ITEMS Section
  const unsoldItems = settlement.unsoldItems || settlement.items.filter(item => item.isSold === false);
  if (unsoldItems.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(200, 0, 0);
    doc.text('✗ UNSOLD ITEMS (No Payment Due)', 14, currentY);
    doc.setTextColor(0, 0, 0);
    
    const unsoldTableData = unsoldItems.map(item => {
      let reason = 'No Bids';
      if (item.status === 'below_reserve' && item.reservePrice) {
        reason = `Reserve Not Met (£${item.reservePrice.toFixed(2)})`;
      }
      return [
        item.lotNumber || 'N/A',
        item.name,
        reason,
      ];
    });
    
    autoTable(doc, {
      startY: currentY + 5,
      head: [['Lot #', 'Item Description', 'Reason']],
      body: unsoldTableData,
      theme: 'plain',
      headStyles: { fillColor: [239, 68, 68], textColor: 255 }, // Red for unsold
      styles: { fontSize: 9, textColor: [100, 100, 100] },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 100 },
        2: { cellWidth: 60, fontStyle: 'italic' },
      },
    });
    
    currentY = (doc as any).lastAutoTable.finalY + 10;
  }
  
  // Summary Stats
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Total Items: ${settlement.items.length} | Sold: ${soldItems.length} | Unsold: ${unsoldItems.length}`, 14, currentY);
  currentY += 10;
  
  // Financial Summary
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Financial Summary', 14, currentY);
  
  const summaryY = currentY + 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  // Summary lines
  doc.text('Total Sales (Hammer Price):', 14, summaryY);
  doc.text(`£${settlement.totalSales.toFixed(2)}`, 180, summaryY, { align: 'right' });
  
  doc.text('Commission:', 14, summaryY + 6);
  doc.text(`-£${settlement.commission.toFixed(2)}`, 180, summaryY + 6, { align: 'right' });
  
  let currentSummaryY = summaryY + 12;

  // Display structured adjustments
  if (settlement.adjustments && settlement.adjustments.length > 0) {
    settlement.adjustments.forEach(adj => {
        doc.text(`${adj.description}:`, 14, currentSummaryY);
        doc.text(`-£${(adj.amount || 0).toFixed(2)}`, 180, currentSummaryY, { align: 'right' });
        currentSummaryY += 6;
    });
  } else {
    // Fallback to legacy expenses if no structured adjustments
    doc.text('Fees & Expenses:', 14, currentSummaryY);
    doc.text(`-£${settlement.expenses.toFixed(2)}`, 180, currentSummaryY, { align: 'right' });
    currentSummaryY += 6;
  }
  
  // Net Payout (highlighted)
  doc.setDrawColor(159, 19, 251);
  doc.setLineWidth(0.5);
  doc.line(14, currentSummaryY + 2, pageWidth - 14, currentSummaryY + 2);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 128, 0);
  doc.text('NET PAYOUT:', 14, currentSummaryY + 9);
  doc.text(`£${settlement.netPayout.toFixed(2)} ${settlement.currency}`, 180, currentSummaryY + 9, { align: 'right' });
  
  // Footer
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  const footerY = doc.internal.pageSize.getHeight() - 20;
  doc.text('This is a computer-generated settlement statement.', pageWidth / 2, footerY, { align: 'center' });
  doc.text('For queries, please contact: admin@elevateitauctions.com', pageWidth / 2, footerY + 4, { align: 'center' });
  doc.text(`Generated on ${new Date().toLocaleDateString('en-GB')} at ${new Date().toLocaleTimeString('en-GB')}`, pageWidth / 2, footerY + 8, { align: 'center' });
  
  return doc;
}

export function downloadSettlementPDF(settlement: SettlementData) {
  const doc = generateSettlementPDF(settlement);
  doc.save(`Settlement_${settlement.reference}.pdf`);
}

export function viewSettlementPDF(settlement: SettlementData) {
  const doc = generateSettlementPDF(settlement);
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, '_blank');
}
