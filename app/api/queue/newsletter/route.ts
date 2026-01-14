import { NextRequest, NextResponse } from "next/server";
import { verifySignatureAppRouter } from "@upstash/qstash/dist/nextjs";
import prisma from "@/lib/prisma";
import { 
  sendEmail, 
  generateUpcomingAuctionNewsletterHTML, 
  generateNewItemNewsletterHTML,
  generateGeneralNewsletterHTML 
} from "@/lib/email";
import { z } from "zod";

const NewsletterQueuePayloadSchema = z.object({
  type: z.enum(['upcoming_auction', 'new_item', 'general_news']),
  auctionId: z.string().optional(),
  auctionItemId: z.string().optional(),
  subject: z.string().optional(),
  content: z.string().optional(),
  imageUrl: z.string().optional(),
  readMoreUrl: z.string().optional(),
});

async function handler(request: NextRequest) {
  try {
    const body = await request.json();
    const result = NewsletterQueuePayloadSchema.safeParse(body);

    if (!result.success) {
      console.error("Invalid newsletter queue payload:", result.error);
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const data = result.data;
    const frontendUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // 1. Fetch data based on type
    let auction = null;
    let auctionItem = null;

    if (data.type === 'upcoming_auction' && data.auctionId) {
      auction = await prisma.auction.findUnique({
        where: { id: data.auctionId },
        include: { items: { select: { id: true } } },
      });
      if (!auction) return NextResponse.json({ error: "Auction not found" }, { status: 404 });
    } else if (data.type === 'new_item' && data.auctionItemId) {
      auctionItem = await prisma.auctionItem.findUnique({
        where: { id: data.auctionItemId },
        include: { 
          auction: true,
          productImages: { take: 1, orderBy: { createdAt: 'asc' } }
        },
      });
      if (!auctionItem) return NextResponse.json({ error: "Auction item not found" }, { status: 404 });
    }

    // 2. Get all subscribed users
    const subscribedUsers = await prisma.user.findMany({
      where: { newsletter: true },
      select: { id: true, email: true, firstName: true, lastName: true },
    });

    if (subscribedUsers.length === 0) {
      return NextResponse.json({ success: true, message: "No subscribers" });
    }

    // 3. Process in batches
    const batchSize = 10;
    for (let i = 0; i < subscribedUsers.length; i += batchSize) {
      const batch = subscribedUsers.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (user) => {
          try {
            const userName = `${user.firstName} ${user.lastName}`.trim() || user.email;
            const unsubscribeUrl = `${frontendUrl}/profile?unsubscribe=true`;
            let emailHtml = '';
            let subject = '';

            if (data.type === 'upcoming_auction' && auction) {
              const auctionUrl = `${frontendUrl}/auction?auction=${auction.slug || auction.id}`;
              subject = `Upcoming Auction: ${auction.name}`;
              emailHtml = generateUpcomingAuctionNewsletterHTML({
                userName,
                auctionName: auction.name,
                auctionDescription: auction.description || undefined,
                auctionImageUrl: auction.imageUrl || data.imageUrl || undefined,
                startDate: auction.startDate?.toISOString(),
                endDate: auction.endDate?.toISOString(),
                location: auction.location || undefined,
                itemCount: auction.items.length,
                auctionUrl,
                unsubscribeUrl,
              });
            } else if (data.type === 'new_item' && auctionItem) {
              const itemUrl = `${frontendUrl}/auction-item/${auctionItem.id}`;
              subject = `New Item: ${auctionItem.name} in ${auctionItem.auction.name}`;
              emailHtml = generateNewItemNewsletterHTML({
                userName,
                itemName: auctionItem.name,
                itemDescription: auctionItem.description || undefined,
                itemImageUrl: auctionItem.productImages?.[0]?.url || data.imageUrl || undefined,
                baseBidPrice: auctionItem.baseBidPrice,
                lotNumber: auctionItem.lotNumber || undefined,
                auctionName: auctionItem.auction.name,
                itemUrl,
                unsubscribeUrl,
              });
            } else {
              // General news
              subject = data.subject || "Newsletter Update";
              emailHtml = generateGeneralNewsletterHTML({
                userName,
                subject,
                content: data.content || "",
                imageUrl: data.imageUrl,
                readMoreUrl: data.readMoreUrl,
                unsubscribeUrl,
              });
            }

            await sendEmail({ to: user.email, subject, html: emailHtml });
          } catch (err) {
            console.error(`Failed to send newsletter to ${user.email}:`, err);
          }
        })
      );

      // Delay between batches
      if (i + batchSize < subscribedUsers.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Newsletter queue processing error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export const POST = verifySignatureAppRouter(handler);
