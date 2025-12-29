/**
 * Affiliate Program Integrations
 * Connects affiliate system with GHL, Stripe, PayPal, and other platforms
 */

import { affiliateService } from './affiliate-service';
import { getGHLOAuthService } from './ghl-oauth';
import { getGHLService } from './ghl-integration';
import axios from 'axios';
import Stripe from 'stripe';

export interface AffiliateIntegrationConfig {
  ghl: {
    enabled: boolean;
    pipelineId?: string;
    affiliateStageId?: string;
    conversionStageId?: string;
  };
  stripe: {
    enabled: boolean;
    secretKey?: string;
    webhookSecret?: string;
  };
  paypal: {
    enabled: boolean;
    clientId?: string;
    clientSecret?: string;
    sandbox?: boolean;
  };
  revolut: {
    enabled: boolean;
    apiKey?: string;
    webhookSecret?: string;
    merchantId?: string;
  };
  analytics: {
    enabled: boolean;
    googleAnalyticsId?: string;
    facebookPixelId?: string;
  };
}

export class AffiliateIntegrationsService {
  private config: AffiliateIntegrationConfig;

  constructor(config: AffiliateIntegrationConfig) {
    this.config = config;
  }

  /**
   * GHL Integration: Sync affiliate data with GoHighLevel
   */
  async syncAffiliateToGHL(affiliateData: {
    id: string;
    name: string;
    email: string;
    affiliateCode: string;
    commissionRate: number;
    totalEarnings: number;
    totalReferrals: number;
  }): Promise<void> {
    if (!this.config.ghl.enabled) return;

    try {
      const ghlService = getGHLOAuthService() || getGHLService();
      if (!ghlService) {
        console.warn('GHL service not available for affiliate sync');
        return;
      }

      // Create/update affiliate as contact in GHL
      const contactData = {
        firstName: affiliateData.name.split(' ')[0],
        lastName: affiliateData.name.split(' ').slice(1).join(' '),
        email: affiliateData.email,
        tags: [
          'Affiliate Partner',
          'Professional Diver Training',
          `Commission Rate: ${affiliateData.commissionRate}%`,
          `Total Earnings: $${(affiliateData.totalEarnings / 100).toFixed(2)}`,
          `Referrals: ${affiliateData.totalReferrals}`
        ],
        customFields: {
          affiliateCode: affiliateData.affiliateCode,
          commissionRate: affiliateData.commissionRate,
          totalEarnings: affiliateData.totalEarnings,
          totalReferrals: affiliateData.totalReferrals,
          affiliateStatus: 'Active',
          lastSyncDate: new Date().toISOString()
        },
        source: 'Affiliate Program'
      };

      await ghlService.createOrUpdateContact(contactData);

      // Create opportunity for high-performing affiliates
      if (affiliateData.totalEarnings > 10000) { // $100+ in earnings
        await this.createGHLOpportunity(affiliateData);
      }

      console.log('✅ Synced affiliate to GHL:', affiliateData.email);
    } catch (error) {
      console.error('❌ Error syncing affiliate to GHL:', error);
    }
  }

  /**
   * Create GHL opportunity for affiliate partnership
   */
  private async createGHLOpportunity(affiliateData: any): Promise<void> {
    try {
      const ghlService = getGHLOAuthService() || getGHLService();
      if (!ghlService) return;

      const contact = await ghlService.findContactByEmail(affiliateData.email);
      if (!contact) return;

      const opportunityData = {
        contactId: contact.id,
        pipelineId: this.config.ghl.pipelineId || 'default',
        stageId: this.config.ghl.affiliateStageId || 'affiliate-partner',
        name: `${affiliateData.name} - Affiliate Partnership`,
        monetaryValue: affiliateData.totalEarnings,
        status: 'open',
        source: 'Affiliate Program - High Performer'
      };

      await ghlService.createOpportunity(opportunityData);
      console.log('✅ Created GHL opportunity for affiliate:', affiliateData.email);
    } catch (error) {
      console.error('❌ Error creating GHL opportunity:', error);
    }
  }

  /**
   * Track affiliate referral conversion in GHL
   */
  async trackReferralConversionInGHL(referralData: {
    affiliateCode: string;
    affiliateName: string;
    affiliateEmail: string;
    referredUserEmail: string;
    referredUserName: string;
    subscriptionType: string;
    monthlyValue: number;
    commissionEarned: number;
  }): Promise<void> {
    if (!this.config.ghl.enabled) return;

    try {
      const ghlService = getGHLOAuthService() || getGHLService();
      if (!ghlService) return;

      // 1. Update affiliate contact with new conversion
      const affiliateContact = await ghlService.findContactByEmail(referralData.affiliateEmail);
      if (affiliateContact) {
        await ghlService.addTagsToContact(affiliateContact.id, [
          'New Conversion',
          `Referred: ${referralData.referredUserName}`,
          `Commission: $${(referralData.commissionEarned / 100).toFixed(2)}`
        ]);
      }

      // 2. Create/update referred user contact
      const referredContactData = {
        firstName: referralData.referredUserName.split(' ')[0],
        lastName: referralData.referredUserName.split(' ').slice(1).join(' '),
        email: referralData.referredUserEmail,
        tags: [
          'Professional Diver Training',
          'Affiliate Referral',
          `Referred by: ${referralData.affiliateName}`,
          `Subscription: ${referralData.subscriptionType}`
        ],
        customFields: {
          referredBy: referralData.affiliateCode,
          affiliateName: referralData.affiliateName,
          subscriptionType: referralData.subscriptionType,
          monthlyValue: referralData.monthlyValue,
          referralDate: new Date().toISOString()
        },
        source: `Affiliate Referral - ${referralData.affiliateCode}`
      };

      await ghlService.createOrUpdateContact(referredContactData);

      // 3. Create opportunity for the conversion
      const referredContact = await ghlService.findContactByEmail(referralData.referredUserEmail);
      if (referredContact) {
        const opportunityData = {
          contactId: referredContact.id,
          pipelineId: this.config.ghl.pipelineId || 'default',
          stageId: this.config.ghl.conversionStageId || 'converted',
          name: `${referralData.referredUserName} - Affiliate Conversion`,
          monetaryValue: referralData.monthlyValue,
          status: 'won',
          source: `Affiliate: ${referralData.affiliateCode}`
        };

        await ghlService.createOpportunity(opportunityData);
      }

      console.log('✅ Tracked affiliate conversion in GHL');
    } catch (error) {
      console.error('❌ Error tracking conversion in GHL:', error);
    }
  }

  /**
   * Stripe Integration: Test connection and verify API key
   */
  async testStripeConnection(): Promise<{
    success: boolean;
    message: string;
    accountId?: string;
    accountName?: string;
    livemode?: boolean;
    paymentLinks?: Array<{ id: string; url: string; active: boolean }>;
    error?: string;
  }> {
    if (!this.config.stripe.enabled || !this.config.stripe.secretKey) {
      return {
        success: false,
        message: 'Stripe not configured - STRIPE_SECRET_KEY not set'
      };
    }

    try {
      const stripe = new Stripe(this.config.stripe.secretKey!, { apiVersion: '2024-12-18.acacia' });
      
      // Test connection by retrieving account information
      const account = await stripe.account.retrieve();
      
      // Try to retrieve payment links to verify they're accessible
      const paymentLinks: Array<{ id: string; url: string; active: boolean }> = [];
      try {
        const links = await stripe.paymentLinks.list({ limit: 10 });
        for (const link of links.data) {
          paymentLinks.push({
            id: link.id,
            url: link.url,
            active: link.active
          });
        }
      } catch (linkError) {
        console.warn('⚠️ Could not retrieve payment links:', linkError);
      }
      
      console.log('✅ Stripe connection successful:', {
        accountId: account.id,
        accountName: account.business_profile?.name || account.display_name || 'N/A',
        livemode: account.livemode,
        country: account.country,
        paymentLinksFound: paymentLinks.length
      });

      return {
        success: true,
        message: 'Stripe connection successful',
        accountId: account.id,
        accountName: account.business_profile?.name || account.display_name || 'N/A',
        livemode: account.livemode,
        paymentLinks: paymentLinks.length > 0 ? paymentLinks : undefined
      };
    } catch (error: any) {
      console.error('❌ Stripe connection test failed:', error);
      return {
        success: false,
        message: 'Stripe connection test failed',
        error: error.message || 'Unknown error'
      };
    }
  }

  /**
   * Stripe Integration: Process affiliate commission payments
   */
  async processStripeCommissionPayout(payoutData: {
    affiliateId: string;
    affiliateEmail: string;
    amount: number; // in cents
    currency: string;
    description: string;
  }): Promise<any> {
    if (!this.config.stripe.enabled || !this.config.stripe.secretKey) {
      throw new Error('Stripe not configured for commission payouts');
    }

    try {
      const stripe = new Stripe(this.config.stripe.secretKey!, { apiVersion: '2024-12-18.acacia' });

      // Create Stripe transfer to affiliate's connected account
      const transfer = await stripe.transfers.create({
        amount: payoutData.amount,
        currency: payoutData.currency,
        destination: `acct_${payoutData.affiliateId}`, // Affiliate's Stripe Connect account
        description: payoutData.description,
        metadata: {
          affiliateId: payoutData.affiliateId,
          affiliateEmail: payoutData.affiliateEmail,
          type: 'affiliate_commission'
        }
      });

      // Log the payout
      console.log('✅ Processed Stripe commission payout:', {
        transferId: transfer.id,
        amount: payoutData.amount,
        affiliate: payoutData.affiliateEmail
      });

      // Update affiliate record
      await this.recordCommissionPayout(payoutData.affiliateId, {
        payoutId: transfer.id,
        amount: payoutData.amount,
        method: 'stripe',
        status: 'completed',
        processedAt: new Date()
      });

      return transfer;
    } catch (error) {
      console.error('❌ Stripe commission payout error:', error);
      throw error;
    }
  }

  /**
   * PayPal Integration: Alternative commission payout method
   */
  async processPayPalCommissionPayout(payoutData: {
    affiliateId: string;
    affiliateEmail: string;
    amount: number;
    currency: string;
    description: string;
  }): Promise<any> {
    if (!this.config.paypal.enabled) {
      throw new Error('PayPal not configured for commission payouts');
    }

    try {
      const paypalBaseUrl = this.config.paypal.sandbox 
        ? 'https://api.sandbox.paypal.com'
        : 'https://api.paypal.com';

      // Get PayPal access token
      const authResponse = await axios.post(`${paypalBaseUrl}/v1/oauth2/token`, 
        'grant_type=client_credentials', {
        headers: {
          'Accept': 'application/json',
          'Accept-Language': 'en_US',
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        auth: {
          username: this.config.paypal.clientId!,
          password: this.config.paypal.clientSecret!
        }
      });

      const accessToken = authResponse.data.access_token;

      // Create PayPal payout
      const payoutRequest = {
        sender_batch_header: {
          sender_batch_id: `affiliate_${payoutData.affiliateId}_${Date.now()}`,
          email_subject: 'Professional Diver Training - Commission Payment',
          email_message: 'Thank you for your partnership! Here is your commission payment.'
        },
        items: [{
          recipient_type: 'EMAIL',
          amount: {
            value: (payoutData.amount / 100).toFixed(2),
            currency: payoutData.currency
          },
          receiver: payoutData.affiliateEmail,
          note: payoutData.description,
          sender_item_id: `commission_${payoutData.affiliateId}`
        }]
      };

      const payoutResponse = await axios.post(`${paypalBaseUrl}/v1/payments/payouts`, 
        payoutRequest, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      });

      console.log('✅ Processed PayPal commission payout:', payoutResponse.data.batch_header.payout_batch_id);

      // Record the payout
      await this.recordCommissionPayout(payoutData.affiliateId, {
        payoutId: payoutResponse.data.batch_header.payout_batch_id,
        amount: payoutData.amount,
        method: 'paypal',
        status: 'pending',
        processedAt: new Date()
      });

      return payoutResponse.data;
    } catch (error) {
      console.error('❌ PayPal commission payout error:', error);
      throw error;
    }
  }

  /**
   * Revolut Integration: Process affiliate commission payments via bank transfer
   */
  async processRevolutBankTransferPayout(payoutData: {
    affiliateId: string;
    affiliateEmail: string;
    amount: number; // in cents
    currency: string;
    description: string;
    bankDetails: {
      accountNumber: string;
      sortCode?: string;
      iban?: string;
      swift?: string;
      accountHolderName: string;
      bankName?: string;
    };
  }): Promise<any> {
    if (!this.config.revolut.enabled || !this.config.revolut.apiKey) {
      throw new Error('Revolut not configured for bank transfer payouts');
    }

    try {
      // Revolut Business API for bank transfers
      // Note: This requires Revolut Business API access
      const revolutBaseUrl = 'https://b2b.revolut.com/api/1.0';
      
      const transferRequest = {
        request_id: `affiliate_${payoutData.affiliateId}_${Date.now()}`,
        account_id: this.config.revolut.merchantId,
        counterparty_id: payoutData.affiliateId, // Would need to create counterparty first
        amount: payoutData.amount,
        currency: payoutData.currency,
        reference: payoutData.description,
        description: `Affiliate Commission: ${payoutData.description}`,
        // Bank account details
        counterparty: {
          profile_type: 'business',
          name: payoutData.bankDetails.accountHolderName,
          bank_country: 'GB', // Default, should be configurable
          account_details: [
            {
              iban: payoutData.bankDetails.iban || '',
              account_no: payoutData.bankDetails.accountNumber,
              sort_code: payoutData.bankDetails.sortCode || '',
              bank_name: payoutData.bankDetails.bankName || ''
            }
          ]
        }
      };

      const response = await axios.post(
        `${revolutBaseUrl}/transfer`,
        transferRequest,
        {
          headers: {
            'Authorization': `Bearer ${this.config.revolut.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Processed Revolut bank transfer payout:', {
        transferId: response.data.id,
        amount: payoutData.amount,
        affiliate: payoutData.affiliateEmail
      });

      // Update affiliate record
      await this.recordCommissionPayout(payoutData.affiliateId, {
        payoutId: response.data.id,
        amount: payoutData.amount,
        method: 'bank_transfer',
        status: 'pending', // Bank transfers may take 1-3 business days
        processedAt: new Date()
      });

      return response.data;
    } catch (error: any) {
      console.error('❌ Revolut bank transfer payout error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Bank Transfer Payout: Manual or automated bank transfer
   * This can be used with Revolut or any bank that supports API transfers
   */
  async processBankTransferPayout(payoutData: {
    affiliateId: string;
    affiliateEmail: string;
    amount: number; // in cents
    currency: string;
    description: string;
    bankDetails: {
      accountNumber: string;
      sortCode?: string;
      iban?: string;
      swift?: string;
      accountHolderName: string;
      bankName?: string;
    };
    useRevolut?: boolean; // If true, use Revolut API; if false, generate manual transfer instructions
  }): Promise<any> {
    if (payoutData.useRevolut && this.config.revolut.enabled) {
      return await this.processRevolutBankTransferPayout(payoutData);
    }

    // Manual bank transfer - generate instructions
    const transferInstructions = {
      type: 'manual_bank_transfer',
      affiliateId: payoutData.affiliateId,
      affiliateEmail: payoutData.affiliateEmail,
      amount: payoutData.amount,
      currency: payoutData.currency,
      description: payoutData.description,
      bankDetails: payoutData.bankDetails,
      instructions: {
        fromAccount: 'LEAD RECON LTD - Revolut Business',
        toAccount: payoutData.bankDetails.accountHolderName,
        amount: `$${(payoutData.amount / 100).toFixed(2)} ${payoutData.currency}`,
        reference: `AFF-${payoutData.affiliateId}-${Date.now()}`,
        notes: payoutData.description
      },
      status: 'pending_manual',
      createdAt: new Date()
    };

    console.log('📋 Generated manual bank transfer instructions:', transferInstructions);

    // Record the payout as pending
    await this.recordCommissionPayout(payoutData.affiliateId, {
      payoutId: `MANUAL-${Date.now()}`,
      amount: payoutData.amount,
      method: 'bank_transfer',
      status: 'pending_manual',
      processedAt: new Date()
    });

    return transferInstructions;
  }

  /**
   * Record commission payout in affiliate system
   */
  private async recordCommissionPayout(affiliateId: string, payoutData: {
    payoutId: string;
    amount: number;
    method: string;
    status: string;
    processedAt: Date;
  }): Promise<void> {
    // This would integrate with your affiliate service to record the payout
    // For now, we'll log it
    console.log('📝 Recording commission payout:', {
      affiliateId,
      ...payoutData
    });
  }

  /**
   * Analytics Integration: Track affiliate performance
   */
  async trackAffiliateAnalytics(eventData: {
    affiliateCode: string;
    eventType: 'click' | 'conversion' | 'payout';
    value?: number;
    metadata?: Record<string, any>;
  }): Promise<void> {
    if (!this.config.analytics.enabled) return;

    try {
      // Google Analytics 4 tracking
      if (this.config.analytics.googleAnalyticsId) {
        await this.trackGoogleAnalytics(eventData);
      }

      // Facebook Pixel tracking
      if (this.config.analytics.facebookPixelId) {
        await this.trackFacebookPixel(eventData);
      }

      console.log('✅ Tracked affiliate analytics:', eventData.eventType);
    } catch (error) {
      console.error('❌ Analytics tracking error:', error);
    }
  }

  /**
   * Google Analytics 4 tracking
   */
  private async trackGoogleAnalytics(eventData: any): Promise<void> {
    try {
      const measurementId = this.config.analytics.googleAnalyticsId;
      const apiSecret = process.env.GA4_API_SECRET;

      if (!apiSecret) return;

      const payload = {
        client_id: `affiliate_${eventData.affiliateCode}`,
        events: [{
          name: `affiliate_${eventData.eventType}`,
          parameters: {
            affiliate_code: eventData.affiliateCode,
            value: eventData.value || 0,
            currency: 'USD',
            ...eventData.metadata
          }
        }]
      };

      await axios.post(
        `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`,
        payload
      );
    } catch (error) {
      console.error('Google Analytics tracking error:', error);
    }
  }

  /**
   * Facebook Pixel tracking
   */
  private async trackFacebookPixel(eventData: any): Promise<void> {
    try {
      const pixelId = this.config.analytics.facebookPixelId;
      const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;

      if (!accessToken) return;

      const payload = {
        data: [{
          event_name: `Affiliate${eventData.eventType.charAt(0).toUpperCase() + eventData.eventType.slice(1)}`,
          event_time: Math.floor(Date.now() / 1000),
          custom_data: {
            affiliate_code: eventData.affiliateCode,
            value: eventData.value || 0,
            currency: 'USD'
          }
        }]
      };

      await axios.post(
        `https://graph.facebook.com/v18.0/${pixelId}/events?access_token=${accessToken}`,
        payload
      );
    } catch (error) {
      console.error('Facebook Pixel tracking error:', error);
    }
  }

  /**
   * Automated commission calculation and payout scheduling
   */
  async scheduleCommissionPayouts(): Promise<void> {
    try {
      // Get all affiliates with pending commissions
      const affiliatesWithCommissions = await this.getAffiliatesWithPendingCommissions();

      for (const affiliate of affiliatesWithCommissions) {
        // Calculate total pending commission
        const pendingAmount = affiliate.pendingCommissions;
        
        // Only process if above minimum threshold ($50)
        if (pendingAmount >= 5000) { // $50.00 in cents
          
          // Choose payout method based on affiliate preference
          const payoutMethod = affiliate.preferredPayoutMethod || 'paypal'; // Default to PayPal if Stripe unavailable
          
          if (payoutMethod === 'stripe' && this.config.stripe.enabled) {
            await this.processStripeCommissionPayout({
              affiliateId: affiliate.id,
              affiliateEmail: affiliate.email,
              amount: pendingAmount,
              currency: 'USD',
              description: `Commission payout for ${new Date().toLocaleDateString()}`
            });
          } else if (payoutMethod === 'paypal' && this.config.paypal.enabled) {
            await this.processPayPalCommissionPayout({
              affiliateId: affiliate.id,
              affiliateEmail: affiliate.email,
              amount: pendingAmount,
              currency: 'USD',
              description: `Commission payout for ${new Date().toLocaleDateString()}`
            });
          } else if (payoutMethod === 'bank_transfer' && affiliate.bankDetails) {
            await this.processBankTransferPayout({
              affiliateId: affiliate.id,
              affiliateEmail: affiliate.email,
              amount: pendingAmount,
              currency: 'USD',
              description: `Commission payout for ${new Date().toLocaleDateString()}`,
              bankDetails: affiliate.bankDetails,
              useRevolut: this.config.revolut.enabled
            });
          } else {
            console.warn(`⚠️ Payout method ${payoutMethod} not available or configured for affiliate ${affiliate.email}`);
          }

          // Sync payout to GHL
          await this.syncPayoutToGHL(affiliate, pendingAmount);
        }
      }

      console.log('✅ Completed commission payout processing');
    } catch (error) {
      console.error('❌ Commission payout scheduling error:', error);
    }
  }

  /**
   * Get affiliates with pending commissions
   */
  private async getAffiliatesWithPendingCommissions(): Promise<any[]> {
    // This would integrate with your affiliate service
    // For now, return mock data
    return [
      {
        id: 'affiliate_1',
        email: 'partner@example.com',
        name: 'Demo Partner',
        pendingCommissions: 12500, // $125.00
        preferredPayoutMethod: 'stripe'
      }
    ];
  }

  /**
   * Sync payout information to GHL
   */
  private async syncPayoutToGHL(affiliate: any, amount: number): Promise<void> {
    try {
      const ghlService = getGHLOAuthService() || getGHLService();
      if (!ghlService) return;

      const contact = await ghlService.findContactByEmail(affiliate.email);
      if (contact) {
        await ghlService.addTagsToContact(contact.id, [
          'Commission Paid',
          `Payout: $${(amount / 100).toFixed(2)}`,
          `Date: ${new Date().toLocaleDateString()}`
        ]);

        await ghlService.updateContact(contact.id, {
          customFields: {
            lastPayoutAmount: amount,
            lastPayoutDate: new Date().toISOString(),
            totalPayouts: (contact.customFields?.totalPayouts || 0) + amount
          }
        });
      }
    } catch (error) {
      console.error('Error syncing payout to GHL:', error);
    }
  }
}

// Export singleton instance
let affiliateIntegrationsService: AffiliateIntegrationsService | null = null;

export function initializeAffiliateIntegrations(config: AffiliateIntegrationConfig): AffiliateIntegrationsService {
  if (!affiliateIntegrationsService) {
    affiliateIntegrationsService = new AffiliateIntegrationsService(config);
  }
  return affiliateIntegrationsService;
}

export function getAffiliateIntegrationsService(): AffiliateIntegrationsService | null {
  return affiliateIntegrationsService;
}


