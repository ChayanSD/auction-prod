import { z } from "zod";

export const loginSchema = z.object({
  email: z.email({
    message: "Invalid email address",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters long",
  }),
});

export const registrationSchema = z.object({
  accountType: z.enum(["Bidding", "Seller", "Admin"]).optional(),
  firstName: z.string(),
  middleName: z.string().optional(),
  lastName: z.string(),
  email: z.email(),
  phone: z.string(),
  password: z.string().min(6),
  termsAccepted: z.boolean(),
  newsletter: z.boolean().optional(),
  billing: z.object({
    country: z.string(),
    address1: z.string(),
    address2: z.string().optional(),
    city: z.string(),
    postcode: z.string(),
  }),
  shipping: z.object({
    sameAsBilling: z.boolean().optional(),
    country: z.string().optional(),
    address1: z.string().optional(),
    address2: z.string().optional(),
    city: z.string().optional(),
    postcode: z.string().optional(),
  }),
});

export const BidCreateSchema = z.object({
  auctionItemId: z.cuid("Valid auction item ID required"),
  amount: z.number().positive("Bid amount must be positive"),
});

// Schema for bid response
export const BidResponseSchema = BidCreateSchema.extend({
  id: z.string(),
  userId: z.string(),
  createdAt: z.date(),
});

export const categorySchema = z.object({
  body: z.object({
    name: z.string().min(2),
  }),
});

export const attachCardSchema = z.object({
  userId: z.string().min(1, "User ID is required"), //this is prisma user id
  customerId: z.string().min(1, "Customer ID is required"), //this is stripe customer id
  paymentMethodId: z.string().min(1, "Payment Method ID is required"),
});

export const setupIntentSchema = z.object({
  customerId: z.string().min(1, "Customer ID is required"),
});

export const stripeCustomerSchema = z.object({
  email: z.email(),
  name: z.string().min(2),
  address: z.object({
    country: z.string().min(2),
    line1: z.string().min(2),
    city: z.string().min(2),
    postal_code: z.string().min(2),
  }),
});

export type AttachCardData = z.infer<typeof attachCardSchema>;
export type SetupIntentData = z.infer<typeof setupIntentSchema>;

// Type inference for TS
export type BidCreateData = z.infer<typeof BidCreateSchema>;
export type BidResponseData = z.infer<typeof BidResponseSchema>;

export type RegistrationData = z.infer<typeof registrationSchema>;

export type LoginData = z.infer<typeof loginSchema>;
