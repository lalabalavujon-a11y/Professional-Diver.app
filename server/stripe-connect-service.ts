import Stripe from 'stripe';

/**
 * Stripe Connect Service
 * Handles all Stripe Connect operations for affiliate payouts
 */
export class StripeConnectService {
  private stripe: Stripe | null = null;
  private initialized = false;

  constructor() {
    // Don't initialize in constructor - use lazy initialization
  }

  /**
   * Lazy initialization - only creates Stripe client when actually needed
   */
  private ensureInitialized(): void {
    if (this.initialized && this.stripe) {
      return;
    }

    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required. Stripe Connect features are disabled.');
    }
    
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2025-12-15.clover', // Latest stable API version
    });
    this.initialized = true;
  }

  /**
   * Check if Stripe is configured
   */
  isConfigured(): boolean {
    return !!process.env.STRIPE_SECRET_KEY;
  }

  /**
   * Create a new Stripe Connect Express account
   * Express accounts have simplified onboarding and lower fees
   */
  async createConnectAccount(email: string, userId: string): Promise<Stripe.Account> {
    this.ensureInitialized();
    if (!this.stripe) throw new Error('Stripe not initialized');
    
    try {
      const account = await this.stripe.accounts.create({
        type: 'express',
        email,
        capabilities: {
          transfers: { requested: true },
        },
        metadata: {
          userId,
          platform: 'professional-diver-training',
        },
      });

      return account;
    } catch (error) {
      console.error('Error creating Stripe Connect account:', error);
      throw new Error(`Failed to create Stripe Connect account: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create an onboarding link for a Connect account
   * This redirects the affiliate to Stripe's hosted onboarding page
   */
  async createOnboardingLink(
    accountId: string,
    returnUrl: string,
    refreshUrl?: string
  ): Promise<Stripe.AccountLink> {
    this.ensureInitialized();
    if (!this.stripe) throw new Error('Stripe not initialized');
    
    try {
      const accountLink = await this.stripe.accountLinks.create({
        account: accountId,
        refresh_url: refreshUrl || returnUrl,
        return_url: returnUrl,
        type: 'account_onboarding',
      });

      return accountLink;
    } catch (error) {
      console.error('Error creating onboarding link:', error);
      throw new Error(`Failed to create onboarding link: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get the current status of a Connect account
   * Returns onboarding status and account details
   */
  async getAccountStatus(accountId: string): Promise<{
    detailsSubmitted: boolean;
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
    requirements: Stripe.Account.Requirements;
  }> {
    this.ensureInitialized();
    if (!this.stripe) throw new Error('Stripe not initialized');
    
    try {
      const account = await this.stripe.accounts.retrieve(accountId);

      return {
        detailsSubmitted: account.details_submitted,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        requirements: account.requirements || {},
      };
    } catch (error) {
      console.error('Error retrieving account status:', error);
      throw new Error(`Failed to retrieve account status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a transfer to a Connect account
   * This transfers funds from the platform account to the affiliate's Connect account
   */
  async createTransfer(
    accountId: string,
    amount: number, // in cents
    currency: string = 'usd',
    metadata?: Record<string, string>
  ): Promise<Stripe.Transfer> {
    this.ensureInitialized();
    if (!this.stripe) throw new Error('Stripe not initialized');
    
    try {
      const transfer = await this.stripe.transfers.create({
        amount,
        currency,
        destination: accountId,
        metadata: {
          ...metadata,
          platform: 'professional-diver-training',
          transfer_type: 'affiliate_commission',
        },
      });

      return transfer;
    } catch (error) {
      console.error('Error creating transfer:', error);
      throw new Error(`Failed to create transfer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get account details for a Connect account
   */
  async getAccountDetails(accountId: string): Promise<Stripe.Account> {
    this.ensureInitialized();
    if (!this.stripe) throw new Error('Stripe not initialized');
    
    try {
      const account = await this.stripe.accounts.retrieve(accountId);
      return account;
    } catch (error) {
      console.error('Error retrieving account details:', error);
      throw new Error(`Failed to retrieve account details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a login link for a Connect account
   * Allows affiliates to access their Stripe Express dashboard
   */
  async createLoginLink(accountId: string): Promise<Stripe.LoginLink> {
    this.ensureInitialized();
    if (!this.stripe) throw new Error('Stripe not initialized');
    
    try {
      const loginLink = await this.stripe.accounts.createLoginLink(accountId);
      return loginLink;
    } catch (error) {
      console.error('Error creating login link:', error);
      throw new Error(`Failed to create login link: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Determine onboarding status from account requirements
   */
  getOnboardingStatus(account: Stripe.Account): 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETE' | 'REQUIRES_ACTION' {
    if (!account.details_submitted) {
      return 'NOT_STARTED';
    }

    if (!account.payouts_enabled) {
      const requirements = account.requirements;
      if (requirements?.currently_due && requirements.currently_due.length > 0) {
        return 'REQUIRES_ACTION';
      }
      return 'IN_PROGRESS';
    }

    return 'COMPLETE';
  }

  /**
   * Handle Stripe Connect webhook events
   */
  async handleWebhook(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'account.updated':
        // Account status changed - update in database
        // This will be handled by the webhook route
        break;
      case 'transfer.created':
        // Transfer initiated - log for tracking
        break;
      case 'transfer.paid':
        // Transfer completed - update payment status
        break;
      case 'transfer.failed':
        // Transfer failed - handle error
        break;
      default:
        console.log(`Unhandled Stripe Connect webhook event: ${event.type}`);
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(
    payload: string | Buffer,
    signature: string,
    secret: string
  ): Stripe.Event {
    this.ensureInitialized();
    if (!this.stripe) throw new Error('Stripe not initialized');
    
    try {
      return this.stripe.webhooks.constructEvent(payload, signature, secret);
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      throw new Error('Invalid webhook signature');
    }
  }
}

// Lazy singleton getter - only creates instance when accessed
let _stripeConnectServiceInstance: StripeConnectService | null = null;

export function getStripeConnectService(): StripeConnectService {
  if (!_stripeConnectServiceInstance) {
    _stripeConnectServiceInstance = new StripeConnectService();
  }
  return _stripeConnectServiceInstance;
}

// Export singleton instance for backward compatibility (lazy-loaded)
// The service will only initialize when actually used
export const stripeConnectService = new Proxy({} as StripeConnectService, {
  get(_target, prop) {
    const instance = getStripeConnectService();
    const value = (instance as any)[prop];
    return typeof value === 'function' ? value.bind(instance) : value;
  }
});
