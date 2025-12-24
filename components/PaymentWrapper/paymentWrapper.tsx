"use client";


import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function PaymentWrapper({
  clientSecret,
  children
}: {
  clientSecret?: string | null;
  children: React.ReactNode;
}) {
  console.log("PaymentWrapper clientSecret:", clientSecret);

  const options = clientSecret
    ? {
        clientSecret,
        appearance: {
          theme: "stripe" as const,
        },
      }
    : {};

  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  );
}
