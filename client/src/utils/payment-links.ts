/**
 * Payment Links Utility
 * 
 * Payment Strategy:
 * 1. PRIMARY: Stripe Payment Links (default) - $25/Month and $250/Year
 * 2. FALLBACK: Revolut Payment Links (only when Stripe is offline/unavailable)
 * 
 * To configure custom Stripe Payment Links, set these environment variables:
 * - VITE_STRIPE_PAYMENT_LINK_MONTHLY
 * - VITE_STRIPE_PAYMENT_LINK_ANNUAL
 * 
 * To disable Stripe and use Revolut only, set:
 * - VITE_STRIPE_ENABLED=false
 */

export type SubscriptionType = 'MONTHLY' | 'ANNUAL' | 'YEARLY';

/**
 * Stripe Payment Links (PRIMARY - Default)
 * These are the default Stripe Payment Links for subscriptions
 * Can be overridden via environment variables
 */
const STRIPE_LINKS = {
  MONTHLY: import.meta.env.VITE_STRIPE_PAYMENT_LINK_MONTHLY || 'https://buy.stripe.com/8x24gzg9S2gG7WX4XugMw03',
  ANNUAL: import.meta.env.VITE_STRIPE_PAYMENT_LINK_ANNUAL || 'https://buy.stripe.com/eVq8wP1eY2gG4KLblSgMw04',
  YEARLY: import.meta.env.VITE_STRIPE_PAYMENT_LINK_ANNUAL || 'https://buy.stripe.com/eVq8wP1eY2gG4KLblSgMw04',
};

/**
 * Revolut Payment Links (FALLBACK - when Stripe is offline/unavailable)
 * Only used when Stripe is not available
 */
const REVOLUT_LINKS = {
  MONTHLY: 'https://checkout.revolut.com/pay/79436775-0472-4414-a0ca-b5f151db466b',
  ANNUAL: 'https://checkout.revolut.com/pay/28d2e7d0-4ee7-41ed-bbf1-d2024f9275d8',
  YEARLY: 'https://checkout.revolut.com/pay/28d2e7d0-4ee7-41ed-bbf1-d2024f9275d8',
};

/**
 * Get payment link for a subscription type
 * @param subscriptionType - The subscription type (MONTHLY, ANNUAL, YEARLY)
 * @param useStripe - Whether to use Stripe (default: true) or Revolut
 * @returns The payment link URL
 */
export function getPaymentLink(subscriptionType: SubscriptionType, useStripe: boolean = true): string {
  if (useStripe) {
    return STRIPE_LINKS[subscriptionType] || STRIPE_LINKS.MONTHLY;
  }
  
  // Fallback to Revolut
  return REVOLUT_LINKS[subscriptionType] || REVOLUT_LINKS.MONTHLY;
}

/**
 * Check if Stripe is available/enabled
 * Stripe is enabled by default unless VITE_STRIPE_ENABLED=false is set
 * This can be enhanced in the future to check Stripe API status
 */
export function isStripeAvailable(): boolean {
  // Check if Stripe is explicitly disabled
  if (import.meta.env.VITE_STRIPE_ENABLED === 'false') {
    return false;
  }
  
  // Stripe is available by default (uses hardcoded payment links if env vars not set)
  return true;
}

/**
 * Get payment link with automatic fallback
 * Tries Stripe first (default), falls back to Revolut if Stripe is unavailable/disabled
 * 
 * @param subscriptionType - The subscription type (MONTHLY, ANNUAL, YEARLY)
 * @returns The payment link URL (Stripe if available, otherwise Revolut)
 */
export function getPaymentLinkWithFallback(subscriptionType: SubscriptionType): string {
  const stripeAvailable = isStripeAvailable();
  return getPaymentLink(subscriptionType, stripeAvailable);
}
