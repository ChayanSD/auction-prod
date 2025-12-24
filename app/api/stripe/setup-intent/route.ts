import stripe from "@/lib/stripe";
import { SetupIntentData, setupIntentSchema } from "@/validation/validator";
import { NextRequest, NextResponse } from "next/server";

export const customerCardAttach = {
  async setupIntent(data: SetupIntentData) {
    try {
      const setupIntent = await stripe.setupIntents.create({
        customer: data.customerId,
        payment_method_types: ["card"],
      });

      if (!setupIntent.client_secret) {
        throw new Error("Failed to generate setup intent client secret");
      }

      return setupIntent.client_secret;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("[Stripe SetupIntent Error]:", message);
      throw new Error("Unable to create SetupIntent");
    }
  },
}



export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const validation = setupIntentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues }, { status: 400 });
    }
    const data: SetupIntentData = validation.data;

    const clientSecret = await customerCardAttach.setupIntent(data);

    return NextResponse.json({ clientSecret });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("Setup intent error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}