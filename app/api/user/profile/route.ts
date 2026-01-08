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
      defaultAddressType: (user as any).defaultAddressType || null,
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

/**
 * PATCH /api/user/profile
 * Update current user's profile data (personal details and addresses)
 */
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { firstName, middleName, lastName, phone, billingAddress, shippingAddress, defaultAddressType } = body;

    // Update user details if provided
    if (firstName !== undefined || middleName !== undefined || lastName !== undefined || phone !== undefined || defaultAddressType !== undefined) {
      await prisma.user.update({
        where: { id: session.id },
        data: {
          ...(firstName !== undefined && { firstName }),
          ...(middleName !== undefined && { middleName }),
          ...(lastName !== undefined && { lastName }),
          ...(phone !== undefined && { phone }),
          ...(defaultAddressType !== undefined && { defaultAddressType: defaultAddressType as any }),
        },
      });
    }

    // Update billing address if provided
    if (billingAddress) {
      const existingBilling = await prisma.billingAddress.findUnique({
        where: { userId: session.id },
      });

      if (existingBilling) {
        await prisma.billingAddress.update({
          where: { userId: session.id },
          data: {
            country: billingAddress.country,
            address1: billingAddress.address1,
            address2: billingAddress.address2 || null,
            city: billingAddress.city,
            postcode: billingAddress.postcode,
          },
        });
      } else {
        await prisma.billingAddress.create({
          data: {
            userId: session.id,
            country: billingAddress.country,
            address1: billingAddress.address1,
            address2: billingAddress.address2 || null,
            city: billingAddress.city,
            postcode: billingAddress.postcode,
          },
        });
      }
    }

    // Update shipping address if provided
    if (shippingAddress) {
      const existingShipping = await prisma.shippingAddress.findUnique({
        where: { userId: session.id },
      });

      if (existingShipping) {
        await prisma.shippingAddress.update({
          where: { userId: session.id },
          data: {
            country: shippingAddress.country,
            address1: shippingAddress.address1,
            address2: shippingAddress.address2 || null,
            city: shippingAddress.city,
            postcode: shippingAddress.postcode,
          },
        });
      } else {
        await prisma.shippingAddress.create({
          data: {
            userId: session.id,
            country: shippingAddress.country,
            address1: shippingAddress.address1,
            address2: shippingAddress.address2 || null,
            city: shippingAddress.city,
            postcode: shippingAddress.postcode,
          },
        });
      }
    }

    // Fetch updated user data
    const updatedUser = await prisma.user.findUnique({
      where: { id: session.id },
      include: {
        billingAddress: true,
        shippingAddress: true,
      },
    });

    if (!updatedUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const userData = {
      id: updatedUser.id,
      firstName: updatedUser.firstName,
      middleName: updatedUser.middleName,
      lastName: updatedUser.lastName,
      email: updatedUser.email,
      phone: updatedUser.phone,
      accountType: updatedUser.accountType,
      stripeCustomerId: updatedUser.stripeCustomerId,
      billingAddress: updatedUser.billingAddress,
      shippingAddress: updatedUser.shippingAddress,
      defaultAddressType: (updatedUser as any).defaultAddressType || null,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    };

    return NextResponse.json({
      user: userData,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to update user profile";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

