/**
 * GoHighLevel (GHL) Integration Service - OAuth 2.0 Version
 * Connects Professional Diver Training Platform with GHL Sub-Account: RanYKgzAFnSUqSIKrjOb
 * Uses OAuth 2.0 flow as GHL has discontinued local API keys
 */

import axios, { AxiosInstance } from 'axios';

export interface GHLContact {
  id?: string;
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
  tags?: string[];
  customFields?: Record<string, any>;
  source?: string;
  assignedTo?: string;
}

export interface GHLOpportunity {
  id?: string;
  contactId: string;
  pipelineId: string;
  stageId: string;
  name: string;
  monetaryValue?: number;
  status: string;
  source?: string;
}

export interface GHLWebhookPayload {
  type: string;
  locationId: string;
  contactId?: string;
  opportunityId?: string;
  data: any;
}

export class GHLIntegrationService {
  private apiClient: AxiosInstance;
  private readonly baseURL = 'https://services.leadconnectorhq.com';
  private readonly subAccountId = 'RanYKgzAFnSUqSIKrjOb';
  
  constructor(private apiKey: string) {
    this.apiClient = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
      }
    });
  }

  /**
   * Create or update a contact in GHL
   */
  async createOrUpdateContact(contactData: GHLContact): Promise<any> {
    try {
      // Check if contact exists by email
      const existingContact = await this.findContactByEmail(contactData.email);
      
      if (existingContact) {
        // Update existing contact
        return await this.updateContact(existingContact.id, contactData);
      } else {
        // Create new contact
        return await this.createContact(contactData);
      }
    } catch (error) {
      console.error('Error creating/updating GHL contact:', error);
      throw error;
    }
  }

  /**
   * Create a new contact in GHL
   */
  async createContact(contactData: GHLContact): Promise<any> {
    try {
      const response = await this.apiClient.post(`/contacts/`, {
        ...contactData,
        locationId: this.subAccountId,
        tags: [...(contactData.tags || []), 'Professional Diver Training', 'Platform User']
      });
      
      console.log('✅ Created GHL contact:', response.data.contact?.id);
      return response.data.contact;
    } catch (error) {
      console.error('❌ Error creating GHL contact:', error);
      throw error;
    }
  }

  /**
   * Update an existing contact in GHL
   */
  async updateContact(contactId: string, contactData: Partial<GHLContact>): Promise<any> {
    try {
      const response = await this.apiClient.put(`/contacts/${contactId}`, {
        ...contactData,
        locationId: this.subAccountId
      });
      
      console.log('✅ Updated GHL contact:', contactId);
      return response.data.contact;
    } catch (error) {
      console.error('❌ Error updating GHL contact:', error);
      throw error;
    }
  }

  /**
   * Find contact by email
   */
  async findContactByEmail(email: string): Promise<any> {
    try {
      const response = await this.apiClient.get(`/contacts/search`, {
        params: {
          locationId: this.subAccountId,
          email: email
        }
      });
      
      return response.data.contacts?.[0] || null;
    } catch (error) {
      console.error('Error finding GHL contact by email:', error);
      return null;
    }
  }

  /**
   * Create an opportunity (lead) in GHL
   */
  async createOpportunity(opportunityData: GHLOpportunity): Promise<any> {
    try {
      const response = await this.apiClient.post(`/opportunities/`, {
        ...opportunityData,
        locationId: this.subAccountId
      });
      
      console.log('✅ Created GHL opportunity:', response.data.opportunity?.id);
      return response.data.opportunity;
    } catch (error) {
      console.error('❌ Error creating GHL opportunity:', error);
      throw error;
    }
  }

  /**
   * Add tags to a contact
   */
  async addTagsToContact(contactId: string, tags: string[]): Promise<void> {
    try {
      await this.apiClient.post(`/contacts/${contactId}/tags`, {
        tags: tags
      });
      
      console.log('✅ Added tags to GHL contact:', contactId, tags);
    } catch (error) {
      console.error('❌ Error adding tags to GHL contact:', error);
      throw error;
    }
  }

  /**
   * Track course enrollment in GHL
   */
  async trackCourseEnrollment(userEmail: string, courseName: string, courseType: string): Promise<void> {
    try {
      const contact = await this.findContactByEmail(userEmail);
      
      if (contact) {
        // Add course-specific tags
        const tags = [
          `Course: ${courseName}`,
          `Type: ${courseType}`,
          'Enrolled',
          new Date().toISOString().split('T')[0] // Date tag
        ];
        
        await this.addTagsToContact(contact.id, tags);
        
        // Update custom fields
        await this.updateContact(contact.id, {
          customFields: {
            lastCourseEnrolled: courseName,
            enrollmentDate: new Date().toISOString(),
            courseType: courseType
          }
        });
      }
    } catch (error) {
      console.error('Error tracking course enrollment in GHL:', error);
    }
  }

  /**
   * Track course completion in GHL
   */
  async trackCourseCompletion(userEmail: string, courseName: string, completionScore?: number): Promise<void> {
    try {
      const contact = await this.findContactByEmail(userEmail);
      
      if (contact) {
        const tags = [
          `Completed: ${courseName}`,
          'Course Graduate',
          `Score: ${completionScore || 'N/A'}`
        ];
        
        await this.addTagsToContact(contact.id, tags);
        
        // Update custom fields
        await this.updateContact(contact.id, {
          customFields: {
            lastCourseCompleted: courseName,
            completionDate: new Date().toISOString(),
            lastScore: completionScore
          }
        });
      }
    } catch (error) {
      console.error('Error tracking course completion in GHL:', error);
    }
  }

  /**
   * Sync user registration with GHL
   */
  async syncUserRegistration(userData: {
    name: string;
    email: string;
    phone?: string;
    subscriptionType: string;
    source?: string;
  }): Promise<void> {
    try {
      const [firstName, ...lastNameParts] = userData.name.split(' ');
      const lastName = lastNameParts.join(' ');
      
      const contactData: GHLContact = {
        firstName,
        lastName,
        email: userData.email,
        phone: userData.phone,
        tags: [
          'Professional Diver Training',
          `Subscription: ${userData.subscriptionType}`,
          userData.source || 'Platform Registration'
        ],
        source: userData.source || 'Professional Diver Training Platform',
        customFields: {
          subscriptionType: userData.subscriptionType,
          registrationDate: new Date().toISOString(),
          platform: 'Professional Diver Training'
        }
      };
      
      const contact = await this.createOrUpdateContact(contactData);
      
      // Create opportunity for paid subscriptions
      if (userData.subscriptionType !== 'TRIAL' && userData.subscriptionType !== 'FREE') {
        await this.createOpportunity({
          contactId: contact.id,
          pipelineId: 'default', // You'll need to set up your pipeline ID
          stageId: 'enrolled', // You'll need to set up your stage ID
          name: `${userData.name} - Professional Diver Training`,
          monetaryValue: this.getSubscriptionValue(userData.subscriptionType),
          status: 'open',
          source: 'Professional Diver Training Platform'
        });
      }
      
      console.log('✅ Synced user registration with GHL:', userData.email);
    } catch (error) {
      console.error('❌ Error syncing user registration with GHL:', error);
    }
  }

  /**
   * Handle webhook from GHL
   */
  async handleWebhook(payload: GHLWebhookPayload): Promise<void> {
    try {
      console.log('📥 Received GHL webhook:', payload.type);
      
      switch (payload.type) {
        case 'ContactCreate':
          await this.handleContactCreate(payload);
          break;
        case 'ContactUpdate':
          await this.handleContactUpdate(payload);
          break;
        case 'OpportunityCreate':
          await this.handleOpportunityCreate(payload);
          break;
        case 'OpportunityStatusUpdate':
          await this.handleOpportunityUpdate(payload);
          break;
        default:
          console.log('🔄 Unhandled webhook type:', payload.type);
      }
    } catch (error) {
      console.error('❌ Error handling GHL webhook:', error);
    }
  }

  private async handleContactCreate(payload: GHLWebhookPayload): Promise<void> {
    // Handle new contact creation from GHL
    console.log('👤 New contact created in GHL:', payload.contactId);
  }

  private async handleContactUpdate(payload: GHLWebhookPayload): Promise<void> {
    // Handle contact updates from GHL
    console.log('📝 Contact updated in GHL:', payload.contactId);
  }

  private async handleOpportunityCreate(payload: GHLWebhookPayload): Promise<void> {
    // Handle new opportunity creation from GHL
    console.log('💼 New opportunity created in GHL:', payload.opportunityId);
  }

  private async handleOpportunityUpdate(payload: GHLWebhookPayload): Promise<void> {
    // Handle opportunity status updates from GHL
    console.log('📊 Opportunity updated in GHL:', payload.opportunityId);
  }

  private getSubscriptionValue(subscriptionType: string): number {
    const values: Record<string, number> = {
      'MONTHLY': 99,
      'YEARLY': 999,
      'LIFETIME': 2999,
      'PREMIUM': 199,
      'ENTERPRISE': 499
    };
    
    return values[subscriptionType] || 0;
  }

  /**
   * Get GHL analytics and sync with platform
   */
  async getAnalytics(): Promise<any> {
    try {
      const response = await this.apiClient.get(`/locations/${this.subAccountId}/analytics`);
      return response.data;
    } catch (error) {
      console.error('Error fetching GHL analytics:', error);
      return null;
    }
  }

  /**
   * Test the GHL connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.apiClient.get(`/locations/${this.subAccountId}`);
      console.log('✅ GHL connection successful:', response.data.location?.name);
      return true;
    } catch (error) {
      console.error('❌ GHL connection failed:', error);
      return false;
    }
  }
}

// Export singleton instance
let ghlService: GHLIntegrationService | null = null;

export function initializeGHL(apiKey: string): GHLIntegrationService {
  if (!ghlService) {
    ghlService = new GHLIntegrationService(apiKey);
  }
  return ghlService;
}

export function getGHLService(): GHLIntegrationService | null {
  return ghlService;
}