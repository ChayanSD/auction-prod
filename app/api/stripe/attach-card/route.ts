import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import stripe from "@/lib/stripe";
import { AttachCardData, attachCardSchema } from "@/validation/validator";
import { createSession, setSessionCookie } from "@/lib/session";

async function attachCard(data: AttachCardData) {
  const { userId, customerId, paymentMethodId } = data;

  try {
    await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });

    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isVerified: true },
    });

    // Create session now that user is fully verified
    const sessionId = await createSession(updatedUser);
    await setSessionCookie(sessionId);

    console.log(`[Stripe Verification] User ${userId} verified successfully.`);
    return {
      success: true,
      message: "Card attached successfully, user verified.",
      user: updatedUser,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`[Stripe Verification] Failed for user ${userId}:`, message);

    // Mark user as unverified instead of deleting
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { isVerified: false },
      });
      console.warn(`[Verification Failed] User ${userId} marked as unverified.`);
    } catch (updateErr: unknown) {
      const updateMessage = updateErr instanceof Error ? updateErr.message : "Unknown error";
      console.error("[Update Error]:", updateMessage);
    }

    throw new Error("Card verification failed. Please try again or contact support.");
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const validation = attachCardSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues }, { status: 400 });
    }
    const data: AttachCardData = validation.data;

    const result = await attachCard(data);

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("Attach card error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}