import { loadStripe, Stripe } from '@stripe/stripe-js';

let stripePromiseInstance: Promise<Stripe | null> | null = null;

export const getStripe = (): Promise<Stripe | null> => {
  if (!stripePromiseInstance) {
    const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!stripeKey) {
      console.warn('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set');
      // Return a promise that resolves to null
      stripePromiseInstance = Promise.resolve(null);
    } else {
      stripePromiseInstance = loadStripe(stripeKey);
    }
  }
  return stripePromiseInstance;
};

export const stripePromise = getStripe();

