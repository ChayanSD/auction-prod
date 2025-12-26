import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import stripe from "@/lib/stripe";

/**
 * GET /api/user/profile
 * Get current user's profile data including addresses and payment methods
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch user with addresses
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      include: {
        billingAddress: true,
        shippingAddress: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Select only the fields we need
    const userData = {
      id: user.id,
      firstName: user.firstName,
      middleName: user.middleName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      accountType: user.accountType,
      stripeCustomerId: user.stripeCustomerId,
      billingAddress: user.billingAddress,
      shippingAddress: user.shippingAddress,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    // Fetch payment methods from Stripe if customer exists
    let paymentMethods: any[] = [];
    if (userData.stripeCustomerId) {
      try {
        const methods = await stripe.paymentMethods.list({
          customer: userData.stripeCustomerId,
          type: 'card',
        });
        paymentMethods = methods.data.map(pm => ({
          id: pm.id,
          type: pm.type,
          card: {
            brand: pm.card?.brand,
            last4: pm.card?.last4,
            expMonth: pm.card?.exp_month,
            expYear: pm.card?.exp_year,
          },
        }));
      } catch (stripeError) {
        console.error('Error fetching payment methods from Stripe:', stripeError);
        // Don't fail the request if Stripe fails
      }
    }

    return NextResponse.json({
      user: userData,
      paymentMethods,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch user profile";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

