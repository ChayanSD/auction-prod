import Stripe from "stripe";
import { env } from "./env";

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion : "2025-12-15.clover"
});

export default stripe;