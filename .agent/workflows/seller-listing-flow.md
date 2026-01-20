---
description: Seller Onboarding and Item Listing Workflow
---

# Seller Onboarding and Item Listing Workflow

This workflow describes the end-to-end process for a user to become a seller and list items for auction.

## 1. Initial Request (Guest or Registered User)

- **Pathway A (New User)**: User visits `/request-to-list`, fills out the item details and contact info. An account is automatically considered for seller status.
- **Pathway B (Logged In User)**: User visits `/request-to-list` or their Profile. They are prompted to "Become a Seller" if not already one.
- **Action**: User submits an `AuctionRequest` with item names, descriptions, and photos.

## 2. Admin Review of Request

- Admin views pending requests in the Admin Panel (`/cms/pannel/listing-requests`).
- Admin can **Approve** or **Reject** the request.
- **Approval**: If the user is not yet a `Seller`, their `accountType` can be upgraded to `Seller` (or they are prompted to complete their profile).

## 3. Seller Profile Completion (Verification)

- Once interested in selling, the user must navigate to the **Seller Portal** (`/profile/seller-portal`).
- **Required Documents**: Seller must upload "Identity Proof" and "Proof of Address" in the **Documents** tab.
- **Bank Details**: Seller must provide bank information for payouts in the **Bank Details** tab.

## 4. Admin Seller Verification

- Admin reviews seller documents in the Admin Panel (`/cms/pannel/sellers`).
- Admin can upload a **Contract/Agreement** for the seller to sign/view.
- Once documents are verified, Admin clicks **Approve Seller**.

## 5. Main Item Listing (Active Sellers)

- Approved sellers use the **Seller Dashboard** as their primary workspace.
- **Submission**: Navigate to the **My Items** tab and click **Submit New Item**.
- **Process**: Fill out the embedded `AuctionRequestForm`.
- **Approval**: Admin reviews and converts the request into an actual `AuctionItem` assigned to a specific `Auction Lot`.

## 6. Post-Auction: Settlements

- After an auction ends and items are paid for, Admins generate **Settlements**.
- Sellers receive an email notification.
- Sellers view and download their **Settlement Statements** (Invoices) from the **Settlements** tab in the Seller Portal.
