-- Add Stripe Connect fields to affiliates table
ALTER TABLE "affiliates" ADD COLUMN IF NOT EXISTS "stripe_connect_account_id" text;
ALTER TABLE "affiliates" ADD COLUMN IF NOT EXISTS "stripe_connect_onboarding_status" text DEFAULT 'NOT_STARTED';
ALTER TABLE "affiliates" ADD COLUMN IF NOT EXISTS "preferred_payment_method" text DEFAULT 'PAYPAL';
ALTER TABLE "affiliates" ADD COLUMN IF NOT EXISTS "stripe_connect_account_email" text;

-- Update commission_payments to support STRIPE_CONNECT payment method
-- (No schema change needed, just documentation - payment_method already supports text)
