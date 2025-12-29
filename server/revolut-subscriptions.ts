/**
 * Revolut Business Subscription Management
 * Handles subscription creation, renewal, and webhook processing
 * 
 * Documentation: https://developer.revolut.com/docs/merchant/create-subscription-plan
 */

import axios from 'axios';

export interface RevolutSubscriptionConfig {
  apiKey: string;
  merchantId?: string;
  webhookSecret?: string;
  baseUrl?: string; // 'https://b2b.revolut.com/api/1.0' for production
}

export interface SubscriptionPlan {
  name: string;
  amount: number; // in cents
  currency: string;
  interval: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';
  intervalCount: number; // e.g., 1 for monthly, 12 for yearly
}

export interface SubscriptionPaymentLink {
  planId: string;
  customerEmail: string;
  customerName?: string;
  metadata?: Record<string, string>;
}

export interface RevolutWebhookEvent {
  event: string;
  timestamp: string;
  data: {
    id: string;
    type: string;
    state: string;
    amount?: number;
    currency?: string;
    customer?: {
      email: string;
      full_name?: string;
    };
    order?: {
      id: string;
      amount: number;
    };
    subscription?: {
      id: string;
      plan_id: string;
      state: string;
      current_period_end?: string;
    };
  };
}

export class RevolutSubscriptionService {
  private config: RevolutSubscriptionConfig;
  private baseUrl: string;

  constructor(config: RevolutSubscriptionConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl || 'https://b2b.revolut.com/api/1.0';
  }

  /**
   * Get authorization headers
   */
  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.config.apiKey}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Create a subscription plan
   * https://developer.revolut.com/docs/merchant/create-subscription-plan
   */
  async createSubscriptionPlan(plan: SubscriptionPlan): Promise<string> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/subscription-plans`,
        {
          name: plan.name,
          amount: plan.amount,
          currency: plan.currency,
          interval: plan.interval,
          interval_count: plan.intervalCount
        },
        { headers: this.getHeaders() }
      );

      console.log('✅ Created Revolut subscription plan:', response.data.id);
      return response.data.id;
    } catch (error: any) {
      console.error('❌ Error creating Revolut subscription plan:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Create or get subscription plans for Monthly and Annual
   */
  async getOrCreateSubscriptionPlans(): Promise<{ monthlyPlanId: string; annualPlanId: string }> {
    // These should be stored in your database/environment after first creation
    // For now, we'll attempt to create them or you can use pre-created plan IDs
    
    const monthlyPlanId = process.env.REVOLUT_MONTHLY_PLAN_ID;
    const annualPlanId = process.env.REVOLUT_ANNUAL_PLAN_ID;

    if (monthlyPlanId && annualPlanId) {
      return { monthlyPlanId, annualPlanId };
    }

    // Create plans if they don't exist
    const monthlyId = await this.createSubscriptionPlan({
      name: 'Professional Diver Training - Monthly',
      amount: 2500, // $25.00
      currency: 'USD',
      interval: 'MONTH',
      intervalCount: 1
    });

    const annualId = await this.createSubscriptionPlan({
      name: 'Professional Diver Training - Annual',
      amount: 25000, // $250.00
      currency: 'USD',
      interval: 'YEAR',
      intervalCount: 1
    });

    console.log('📝 Save these plan IDs to environment variables:');
    console.log(`REVOLUT_MONTHLY_PLAN_ID=${monthlyId}`);
    console.log(`REVOLUT_ANNUAL_PLAN_ID=${annualId}`);

    return { monthlyPlanId: monthlyId, annualPlanId: annualId };
  }

  /**
   * Create a payment order for subscription
   * This creates a checkout session that customers can use to subscribe
   */
  async createSubscriptionOrder(params: {
    planId: string;
    customerEmail: string;
    customerName?: string;
    successUrl?: string;
    cancelUrl?: string;
    metadata?: Record<string, string>;
  }): Promise<{ orderId: string; publicId: string; checkoutUrl: string }> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/orders`,
        {
          amount: 0, // Amount is determined by the subscription plan
          currency: 'USD',
          customer_email: params.customerEmail,
          customer_id: params.customerEmail, // Use email as customer ID
          description: `Subscription: ${params.customerEmail}`,
          metadata: {
            subscription_plan_id: params.planId,
            ...params.metadata
          },
          save_payment_method: true, // Required for subscriptions
          merchant_order_ext_ref: `sub_${Date.now()}`,
          ...(params.successUrl && { success_url: params.successUrl }),
          ...(params.cancelUrl && { cancel_url: params.cancelUrl })
        },
        { headers: this.getHeaders() }
      );

      // Get checkout URL
      const checkoutResponse = await axios.post(
        `${this.baseUrl}/orders/${response.data.id}/checkout`,
        {},
        { headers: this.getHeaders() }
      );

      return {
        orderId: response.data.id,
        publicId: response.data.public_id,
        checkoutUrl: checkoutResponse.data.checkout_url || `https://checkout.revolut.com/pay/${response.data.public_id}`
      };
    } catch (error: any) {
      console.error('❌ Error creating Revolut subscription order:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Create subscription from a saved payment method
   * After customer completes initial payment, create the subscription
   */
  async createSubscription(params: {
    customerId: string;
    planId: string;
    paymentMethodId: string;
  }): Promise<string> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/subscriptions`,
        {
          plan_id: params.planId,
          customer_id: params.customerId,
          payment_method_id: params.paymentMethodId
        },
        { headers: this.getHeaders() }
      );

      console.log('✅ Created Revolut subscription:', response.data.id);
      return response.data.id;
    } catch (error: any) {
      console.error('❌ Error creating Revolut subscription:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get subscription details
   */
  async getSubscription(subscriptionId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/subscriptions/${subscriptionId}`,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error: any) {
      console.error('❌ Error fetching Revolut subscription:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<void> {
    try {
      await axios.post(
        `${this.baseUrl}/subscriptions/${subscriptionId}/cancel`,
        {},
        { headers: this.getHeaders() }
      );
      console.log('✅ Cancelled Revolut subscription:', subscriptionId);
    } catch (error: any) {
      console.error('❌ Error cancelling Revolut subscription:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    // Implement webhook signature verification
    // Revolut provides signature in headers
    // This is a placeholder - implement according to Revolut docs
    return true; // For now, implement proper verification
  }

  /**
   * Handle webhook event
   */
  async handleWebhook(event: RevolutWebhookEvent): Promise<void> {
    try {
      console.log('📥 Received Revolut webhook:', event.event);

      switch (event.event) {
        case 'ORDER_COMPLETED':
          await this.handleOrderCompleted(event);
          break;
        case 'ORDER_AUTHORISED':
          await this.handleOrderAuthorised(event);
          break;
        case 'SUBSCRIPTION_RENEWED':
          await this.handleSubscriptionRenewed(event);
          break;
        case 'SUBSCRIPTION_CANCELLED':
          await this.handleSubscriptionCancelled(event);
          break;
        case 'PAYMENT_CAPTURED':
          await this.handlePaymentCaptured(event);
          break;
        default:
          console.log('🔄 Unhandled Revolut webhook event:', event.event);
      }
    } catch (error) {
      console.error('❌ Error handling Revolut webhook:', error);
      throw error;
    }
  }

  /**
   * Handle order completion - create subscription if payment method saved
   */
  private async handleOrderCompleted(event: RevolutWebhookEvent): Promise<void> {
    const orderId = event.data.order?.id;
    const customerEmail = event.data.customer?.email;
    
    if (!orderId || !customerEmail) {
      console.warn('⚠️ Order completed event missing required data');
      return;
    }

    // Get order details to check if subscription plan is attached
    try {
      const orderResponse = await axios.get(
        `${this.baseUrl}/orders/${orderId}`,
        { headers: this.getHeaders() }
      );

      const planId = orderResponse.data.metadata?.subscription_plan_id;
      if (planId) {
        // Create subscription from saved payment method
        // You'll need to get the payment method ID from the order
        console.log('📝 Order completed with subscription plan, subscription should be created');
      }
    } catch (error) {
      console.error('Error processing order completion:', error);
    }
  }

  /**
   * Handle order authorisation
   */
  private async handleOrderAuthorised(event: RevolutWebhookEvent): Promise<void> {
    console.log('✅ Order authorised:', event.data.order?.id);
  }

  /**
   * Handle subscription renewal
   */
  private async handleSubscriptionRenewed(event: RevolutWebhookEvent): Promise<void> {
    const subscription = event.data.subscription;
    if (!subscription) return;

    // Update user subscription in database
    // This would integrate with your user management service
    console.log('🔄 Subscription renewed:', subscription.id);
    
    // Update subscription expiration date in your database
    // subscription.current_period_end contains the new expiration date
  }

  /**
   * Handle subscription cancellation
   */
  private async handleSubscriptionCancelled(event: RevolutWebhookEvent): Promise<void> {
    const subscription = event.data.subscription;
    if (!subscription) return;

    // Update user subscription status in database
    console.log('❌ Subscription cancelled:', subscription.id);
  }

  /**
   * Handle payment capture
   */
  private async handlePaymentCaptured(event: RevolutWebhookEvent): Promise<void> {
    console.log('💳 Payment captured:', event.data.id);
  }
}

// Export singleton instance
let revolutSubscriptionService: RevolutSubscriptionService | null = null;

export function initializeRevolutSubscriptions(config: RevolutSubscriptionConfig): RevolutSubscriptionService {
  if (!revolutSubscriptionService) {
    revolutSubscriptionService = new RevolutSubscriptionService(config);
  }
  return revolutSubscriptionService;
}

export function getRevolutSubscriptionService(): RevolutSubscriptionService | null {
  return revolutSubscriptionService;
}






