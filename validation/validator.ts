import { z } from "zod";

// enums
export const AuctionStatusEnum = z.enum([
  "Draft",
  "Upcoming",
  "Active",
  "Ended",
  "Cancelled",
]);

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
  auctionItemId: z.string().min(1, "Valid auction item ID required"),
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
    imageUrl: z.url().optional(),
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

// Schema for connecting tags
export const TagSchema = z.object({
  id: z.cuid().optional(),
  name: z.string().min(1, "Tag name is required"),
});

// Core auction creation schema
export const AuctionCreateSchema = z.object({
  name: z.string().min(1, "Auction name is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  location: z.string().min(1, "Location is required"),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, "Slug must be URL-friendly")
    .optional(),
  status: AuctionStatusEnum.optional().default("Draft"),
  categoryId: z.cuid("Valid category ID required"),
  imageUrl : z.string().optional(),
  tags: z.array(TagSchema).optional(),
});

export const AuctionUpdateSchema = AuctionCreateSchema.partial();

export const AuctionResponseSchema = AuctionCreateSchema.extend({
  id: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const ProductImageSchema = z.object({
  url: z.url("Invalid image URL"),
  altText: z.string().optional(),
});

export const BidSchema = z.object({
  userId: z.cuid("Invalid user ID").optional(), // Optional - will use session user
  amount: z.number().min(0, "Bid amount must be positive"),
});

// export const BidCreateSchema = z.object({
//   auctionItemId: z.string().min(1, "Auction item ID is required"),
//   amount: z.number().min(0, "Bid amount must be positive"),
// });

export const AuctionItemCreateSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),

  auctionId: z.cuid("Valid auction ID required"),

  startDate: z.coerce.date(),
  endDate: z.coerce.date(),

  shipping: z
    .object({
      address: z.string(),
      cost: z.number().min(0),
      deliveryTime: z.string().optional(),
    })
    .optional(),

  terms: z.string().optional(),

  baseBidPrice: z.number().min(0, "Base bid price must be positive"),
  additionalFee: z.number().min(0).optional(),
  currentBid: z.number().min(0).optional().default(0),
  estimatedPrice: z.number().min(0).optional(),

  productImages: z.array(ProductImageSchema).optional(),
  bids: z.array(BidSchema).optional(),
});

export type AuctionItemCreateData = z.infer<typeof AuctionItemCreateSchema>;

export type AttachCardData = z.infer<typeof attachCardSchema>;
export type SetupIntentData = z.infer<typeof setupIntentSchema>;

// Type inference for TS
export type BidCreateData = z.infer<typeof BidCreateSchema>;
export type BidResponseData = z.infer<typeof BidResponseSchema>;

export type RegistrationData = z.infer<typeof registrationSchema>;

export type LoginData = z.infer<typeof loginSchema>;

export type AuctionCreateData = z.infer<typeof AuctionCreateSchema>;
export type AuctionUpdateData = z.infer<typeof AuctionUpdateSchema>;
export type AuctionResponseData = z.infer<typeof AuctionResponseSchema>;
