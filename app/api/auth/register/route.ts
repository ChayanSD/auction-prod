import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { registrationSchema, type RegistrationData } from "@/validation/validator";
import { createSession, setSessionCookie } from "@/lib/session";
import stripe from "@/lib/stripe";

const registerUser = async (data: RegistrationData) => {
  // 1. Hash password
  const hashedPassword = await bcrypt.hash(data.password, 10);

  // 2. Create user
  const user = await prisma.user.create({
    data: {
      accountType: data.accountType || 'Bidding',
      firstName: data.firstName,
      middleName: data.middleName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      password: hashedPassword,
      termsAccepted: data.termsAccepted,
      newsletter: data.newsletter ?? false,
      isVerified: false,
    },
  });

  const userId = user.id;

  // 3. Billing address
  await prisma.billingAddress.create({
    data: { userId, ...data.billing },
  });

  // 4. Shipping address
  const shippingData = data.shipping.sameAsBilling
    ? { ...data.billing }
    : {
        country: data.shipping.country!,
        address1: data.shipping.address1!,
        address2: data.shipping.address2,
        city: data.shipping.city!,
        postcode: data.shipping.postcode!,
      };
  await prisma.shippingAddress.create({
    data: { userId, ...shippingData },
  });

  // 5. Stripe: create customer
  const customer = await stripe.customers.create({
    email: data.email,
    name: `${data.firstName} ${data.lastName}`,
    address: {
      country: data.billing.country,
      line1: data.billing.address1,
      city: data.billing.city,
      postal_code: data.billing.postcode,
    }
  });

  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id },
  });

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    accountType: user.accountType,
    isVerified: user.isVerified,
    stripeCustomerId: customer.id
  }
};

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const validation = registrationSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues }, { status: 400 });
    }
    const data: RegistrationData = validation.data;

    const result = await registerUser(data);

    const user = await prisma.user.findUnique({
      where: { id: result.id },
      select: {
        id: true,
        stripeCustomerId: true,
        accountType: true,
        firstName: true,
        middleName: true,
        lastName: true,
        email: true,
        phone: true,
        termsAccepted: true,
        newsletter: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found after creation" }, { status: 500 });
    }

    const sessionId = await createSession(user);
    await setSessionCookie(sessionId);

    return NextResponse.json({ success: true, user: result } , { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
