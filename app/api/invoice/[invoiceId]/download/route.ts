import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
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
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return 'Invalid date';
  }
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> | { invoiceId: string } }
): Promise<NextResponse> {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const resolvedParams = params instanceof Promise ? await params : params;
    const { invoiceId } = resolvedParams;

    if (!invoiceId) {
      return NextResponse.json(
        { error: "Invoice ID is required" },
        { status: 400 }
      );
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        auctionItem: {
          include: {
            productImages: true,
            auction: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    // Fetch winning bid separately
    let winningBid = null;
    if (invoice.winningBidId) {
      winningBid = await prisma.bid.findUnique({
        where: { id: invoice.winningBidId },
        select: {
          id: true,
          amount: true,
          createdAt: true,
        },
      });
    }

    // Check if user has access (owner or admin)
    if (session.accountType !== 'Admin' && invoice.userId !== session.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Create a new PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => {}); // Required for doc.end() to work

    let yPos = 50;

    // Header
    doc.fontSize(24).fillColor('#9F13FB').text('INVOICE', 50, yPos, { align: 'right' });
    doc.fontSize(10).fillColor('#0E0E0E').text('Auction Platform', 50, yPos);
    doc.text('123 Auction Lane', 50, yPos + 15);
    doc.text('London, SW1A 0AA', 50, yPos + 30);
    doc.text('info@auctionplatform.com', 50, yPos + 45);
    yPos += 80;

    // Invoice Details
    doc.fontSize(12).fillColor('#000000').text('Invoice Details', 50, yPos);
    yPos += 15;
    doc.fontSize(10).fillColor('#333333');
    doc.text(`Invoice Number: ${invoice.invoiceNumber}`, 50, yPos);
    doc.text(`Invoice Date: ${formatDate(invoice.createdAt)}`, 50, yPos + 15);
    doc.text(`Status: ${invoice.status}`, 50, yPos + 30);
    if (invoice.paidAt) {
      doc.text(`Paid At: ${formatDate(invoice.paidAt)}`, 50, yPos + 45);
    }
    yPos += 70;

    // Bill To
    doc.fontSize(12).fillColor('#000000').text('Bill To', 50, yPos);
    yPos += 15;
    doc.fontSize(10).fillColor('#333333');
    doc.text(`${invoice.user.firstName} ${invoice.user.lastName}`, 50, yPos);
    doc.text(`${invoice.user.email}`, 50, yPos + 15);
    if (invoice.user.phone) {
      doc.text(`${invoice.user.phone}`, 50, yPos + 30);
    }
    yPos += 50;

    // Auction Item Details
    doc.fontSize(12).fillColor('#000000').text('Auction Item', 50, yPos);
    yPos += 15;
    doc.fontSize(10).fillColor('#333333');
    doc.text(`Item Name: ${invoice.auctionItem.name}`, 50, yPos);
    doc.text(`Auction: ${invoice.auctionItem.auction.name}`, 50, yPos + 15);
    doc.text(`Item Start: ${formatDate(invoice.auctionItem.startDate)}`, 50, yPos + 30);
    doc.text(`Item End: ${formatDate(invoice.auctionItem.endDate)}`, 50, yPos + 45);
    yPos += 70;

    // Payment Summary Table
    doc.fontSize(12).fillColor('#000000').text('Payment Summary', 50, yPos);
    yPos += 15;

    const tableTop = yPos;
    const itemCol = 50;
    const amountCol = 450;

    doc.fontSize(10).font('Helvetica-Bold').text('Description', itemCol, tableTop);
    doc.text('Amount', amountCol, tableTop, { align: 'right' });
    doc.font('Helvetica');
    yPos += 20;

    doc.text('Winning Bid', itemCol, yPos);
    doc.text(formatCurrency(invoice.bidAmount), amountCol, yPos, { align: 'right' });
    yPos += 15;

    if (invoice.additionalFee && invoice.additionalFee > 0) {
      doc.text('Additional Fees', itemCol, yPos);
      doc.text(formatCurrency(invoice.additionalFee), amountCol, yPos, { align: 'right' });
      yPos += 15;
    }

    doc.lineWidth(0.5).strokeColor('#cccccc').moveTo(itemCol, yPos + 5).lineTo(550, yPos + 5).stroke();
    yPos += 15;

    doc.fontSize(12).font('Helvetica-Bold').text('Total Amount Due', itemCol, yPos);
    doc.text(formatCurrency(invoice.totalAmount), amountCol, yPos, { align: 'right' });
    doc.font('Helvetica');
    yPos += 30;

    // Winning Bid Information
    if (winningBid) {
      doc.fontSize(12).fillColor('#000000').text('Winning Bid Information', 50, yPos);
      yPos += 15;
      doc.fontSize(10).fillColor('#333333');
      doc.text(`Bid ID: ${winningBid.id}`, 50, yPos);
      doc.text(`Bid Amount: ${formatCurrency(winningBid.amount)}`, 50, yPos + 15);
      doc.text(`Bid Placed: ${formatDate(winningBid.createdAt)}`, 50, yPos + 30);
      yPos += 50;
    }

    // Notes
    if (invoice.notes) {
      doc.fontSize(12).fillColor('#000000').text('Notes', 50, yPos);
      yPos += 15;
      doc.fontSize(10).fillColor('#666666').text(invoice.notes, 50, yPos, { width: 500 });
      yPos += 30;
    }

    // Footer
    const pageHeight = doc.page.height;
    const footerY = pageHeight - 100;
    doc.fontSize(8).fillColor('#999999');
    doc.text('Thank you for your business!', 50, footerY, { align: 'center', width: 500 });
    doc.text('This is an official invoice document.', 50, footerY + 15, { align: 'center', width: 500 });

    // Finalize PDF
    doc.end();

    // Wait for PDF to be generated
    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
      doc.on('error', reject);
    });

    // Return PDF as response
    // Convert Buffer to Uint8Array for NextResponse compatibility
    const pdfArray = new Uint8Array(pdfBuffer);
    return new NextResponse(pdfArray, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error generating PDF invoice:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to generate PDF invoice";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

