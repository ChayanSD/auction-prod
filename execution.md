### To implement automatic payment using the user's attached card when they win a bid (instead of sending an invoice link for manual payment), you can modify the invoice creation process to immediately charge the saved card. This assumes the user has a saved payment method (card) attached to their Stripe customer profile, as per the existing `Payment` model and `stripeCustomerId` on the `User` model

### High-Level Implementation Steps:
1. **Retrieve the Saved Payment Method**:
   - When creating the invoice (in `app/api/invoice/route.ts`), after fetching the user, query the `Payment` table to get the user's saved payment method (e.g., the `stripeId` field, which should be the Stripe PaymentMethod ID).
   - Ensure the user has at least one saved payment method. If not, fall back to the current flow (creating an invoice link).

2. **Create and Confirm a PaymentIntent**:
   - Use Stripe's API to create a `PaymentIntent` with:
     - `amount`: The total invoice amount (in pence, since the currency is GBP).
     - `currency`: 'gbp'.
     - `customer`: The user's `stripeCustomerId`.
     - `payment_method`: The saved PaymentMethod ID.
     - `off_session`: true (to allow charging without user interaction).
     - `confirm`: true (to confirm the payment immediately).
     - `metadata`: Include `invoiceId` and `invoiceNumber` for tracking.
   - Confirm the PaymentIntent. If successful, the payment is processed automatically using the saved card.

3. **Update the Invoice Status**:
   - If the PaymentIntent confirms successfully, update the invoice in the database:
     - Set `status` to 'Paid'.
     - Set `paidAt` to the current date.
     - Optionally, store the PaymentIntent ID in a new field (e.g., add `stripePaymentIntentId` to the `Invoice` model if needed).
   - If confirmation fails (e.g., due to insufficient funds or card issues), handle the error:
     - Log the failure.
     - Fall back to creating a Stripe invoice (as in the current implementation) and send the hosted invoice URL via email for manual payment.
     - Optionally, notify the user of the failure and provide the manual payment link.

4. **Update the Webhook**:
   - Ensure the webhook (`app/api/stripe/webhook/route.ts`) handles `payment_intent.succeeded` (in addition to or instead of `invoice.payment_succeeded`).
   - In the handler, check the metadata for `invoiceId`, update the invoice to 'Paid' if not already done, and set `paidAt`.
   - This provides a safety net in case the confirmation response is delayed or missed.

5. **Email Notification**:
   - If payment succeeds automatically, send a confirmation email (e.g., "Payment processed successfully for your winning bid").
   - If it fails, send the invoice email with the hosted URL for manual payment.

6. **Error Handling and Security**:
   - Handle Stripe errors (e.g., `card_declined`) gracefully. Use Stripe's error codes to provide user-friendly messages.
   - Ensure PCI compliance by not storing card details directly (rely on Stripe's PaymentMethod IDs).
   - Test with Stripe's test cards to simulate success/failure scenarios.
   - Consider adding rate limiting or fraud detection if needed.

### Key Considerations:
- **Fallback Mechanism**: Always have a manual payment option (via invoice link) as a backup, especially for users without saved cards or failed auto-payments.
- **User Consent**: Ensure users are informed during signup/card attachment that their card may be used for automatic payments on winning bids.
- **Database Changes**: If you want to track PaymentIntent IDs, add a field like `stripePaymentIntentId` to the `Invoice` model.
- **Testing**: Use Stripe's dashboard and webhooks in test mode to verify the flow.
- **Edge Cases**: Handle scenarios like expired cards, multiple saved cards (use the default or most recent), or users with no cards.

This approach shifts from a "pay later" model to "pay now" using saved cards, improving user experience for auctions. If you need more details on specific Stripe API calls or code snippets, let me know!