/**
 * GoHighLevel OAuth 2.0 Integration Service
 * Modern OAuth flow for GHL API access (replaces deprecated local API keys)
 */

import axios, { AxiosInstance } from 'axios';
import { db } from './db';

export interface GHLOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export interface GHLTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  locationId: string;
  userId?: string;
  companyId?: string;
  expires_at?: number;
}

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

export class GHLOAuthService {
  private apiClient: AxiosInstance;
  private readonly baseURL = 'https://services.leadconnectorhq.com';
  private readonly authURL = 'https://marketplace.leadconnectorhq.com/oauth';
  private readonly subAccountId = 'RanYKgzAFnSUqSIKrjOb';
  private tokens: GHLTokens | null = null;
  
  constructor(private config: GHLOAuthConfig) {
    this.apiClient = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
      }
    });
  }

  /**
   * Generate OAuth authorization URL
   */
  getAuthorizationUrl(state?: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scopes.join(' '),
      ...(state && { state })
    });

    return `${this.authURL}/chooselocation?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access tokens
   */
  async exchangeCodeForTokens(code: string): Promise<GHLTokens> {
    try {
      const response = await axios.post(`${this.authURL}/token`, {
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: this.config.redirectUri
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      const tokens: GHLTokens = {
        ...response.data,
        expires_at: Date.now() + (response.data.expires_in * 1000)
      };

      this.tokens = tokens;
      await this.saveTokens(tokens);
      this.updateApiClientAuth();

      console.log('✅ GHL OAuth tokens obtained successfully');
      return tokens;
    } catch (error) {
      console.error('❌ Error exchanging code for tokens:', error);
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(): Promise<GHLTokens> {
    if (!this.tokens?.refresh_token) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await axios.post(`${this.authURL}/token`, {
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: this.tokens.refresh_token
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      const newTokens: GHLTokens = {
        ...this.tokens,
        ...response.data,
        expires_at: Date.now() + (response.data.expires_in * 1000)
      };

      this.tokens = newTokens;
      await this.saveTokens(newTokens);
      this.updateApiClientAuth();

      console.log('✅ GHL access token refreshed successfully');
      return newTokens;
    } catch (error) {
      console.error('❌ Error refreshing access token:', error);
      throw error;
    }
  }

  /**
   * Check if token needs refresh and refresh if necessary
   */
  async ensureValidToken(): Promise<void> {
    if (!this.tokens) {
      await this.loadTokens();
    }

    if (!this.tokens) {
      throw new Error('No tokens available. Please complete OAuth flow.');
    }

    // Refresh if token expires in the next 5 minutes
    const fiveMinutesFromNow = Date.now() + (5 * 60 * 1000);
    if (this.tokens.expires_at && this.tokens.expires_at < fiveMinutesFromNow) {
      await this.refreshAccessToken();
    }
  }

  /**
   * Update API client with current access token
   */
  private updateApiClientAuth(): void {
    if (this.tokens?.access_token) {
      this.apiClient.defaults.headers.common['Authorization'] = `Bearer ${this.tokens.access_token}`;
    }
  }

  /**
   * Save tokens to database
   */
  private async saveTokens(tokens: GHLTokens): Promise<void> {
    try {
      // In a real implementation, you'd save to your database
      // For now, we'll use a simple in-memory storage
      console.log('💾 Saving GHL tokens to storage');
      
      // Mock database save - replace with actual database logic
      await db.get('SELECT 1'); // Placeholder
      
    } catch (error) {
      console.error('Error saving tokens:', error);
    }
  }

  /**
   * Load tokens from database
   */
  private async loadTokens(): Promise<void> {
    try {
      // In a real implementation, you'd load from your database
      console.log('📂 Loading GHL tokens from storage');
      
      // Mock database load - replace with actual database logic
      // this.tokens = await db.getTokens();
      
    } catch (error) {
      console.error('Error loading tokens:', error);
    }
  }

  /**
   * Create or update a contact in GHL
   */
  async createOrUpdateContact(contactData: GHLContact): Promise<any> {
    await this.ensureValidToken();
    
    try {
      // Check if contact exists by email
      const existingContact = await this.findContactByEmail(contactData.email);
      
      if (existingContact) {
        return await this.updateContact(existingContact.id, contactData);
      } else {
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
    await this.ensureValidToken();
    
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
    await this.ensureValidToken();
    
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
    await this.ensureValidToken();
    
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
   * Test the GHL connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.ensureValidToken();
      const response = await this.apiClient.get(`/locations/${this.subAccountId}`);
      console.log('✅ GHL OAuth connection successful:', response.data.location?.name);
      return true;
    } catch (error) {
      console.error('❌ GHL OAuth connection failed:', error);
      return false;
    }
  }

  /**
   * Get current tokens (for debugging)
   */
  getCurrentTokens(): GHLTokens | null {
    return this.tokens;
  }

  /**
   * Check if we have valid tokens
   */
  hasValidTokens(): boolean {
    return !!(this.tokens?.access_token && 
              this.tokens?.expires_at && 
              this.tokens.expires_at > Date.now());
  }
}

// Export singleton instance
let ghlOAuthService: GHLOAuthService | null = null;

export function initializeGHLOAuth(config: GHLOAuthConfig): GHLOAuthService {
  if (!ghlOAuthService) {
    ghlOAuthService = new GHLOAuthService(config);
  }
  return ghlOAuthService;
}

export function getGHLOAuthService(): GHLOAuthService | null {
  return ghlOAuthService;
}


