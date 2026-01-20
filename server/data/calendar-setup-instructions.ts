/**
 * Calendar Setup Instructions
 * Provider-specific setup guides and instructions
 */

import type { CalendarProviderType } from '../lib/calendar-provider-registry';

export interface SetupInstruction {
  step: number;
  title: string;
  description: string;
  details?: string[];
  codeExample?: string;
  screenshot?: string;
  videoUrl?: string;
}

export interface ProviderInstructions {
  provider: CalendarProviderType;
  overview: string;
  prerequisites: string[];
  steps: SetupInstruction[];
  troubleshooting: Array<{ issue: string; solution: string }>;
  additionalResources?: Array<{ title: string; url: string }>;
}

const instructions: Record<CalendarProviderType, ProviderInstructions> = {
  google: {
    provider: 'google',
    overview: 'Connect your Google Calendar to sync events bidirectionally. This uses OAuth for secure authentication.',
    prerequisites: [
      'A Google account with Calendar access',
      'Google Calendar API enabled (handled automatically)',
    ],
    steps: [
      {
        step: 1,
        title: 'Click "Connect Google Calendar"',
        description: 'Click the "Add Connection" button and select "Google Calendar" from the provider list.',
      },
      {
        step: 2,
        title: 'Authorize Access',
        description: 'You will be redirected to Google to authorize calendar access. Click "Allow" to grant permissions.',
        details: [
          'The system requests read and write access to your calendars',
          'You can revoke access at any time from your Google Account settings',
        ],
      },
      {
        step: 3,
        title: 'Select Calendar (Optional)',
        description: 'If you have multiple calendars, you can specify which calendar to sync. Leave blank to use your primary calendar.',
        details: [
          'Enter the Calendar ID (found in Google Calendar settings)',
          'Or leave empty to sync your primary calendar',
        ],
      },
      {
        step: 4,
        title: 'Test Connection',
        description: 'Click "Test Connection" to verify the setup works correctly.',
      },
    ],
    troubleshooting: [
      {
        issue: 'OAuth redirect fails',
        solution: 'Ensure the redirect URI is correctly configured in Google Cloud Console.',
      },
      {
        issue: 'Cannot see events',
        solution: 'Check that the calendar ID is correct and you have access to it.',
      },
    ],
    additionalResources: [
      { title: 'Google Calendar API Documentation', url: 'https://developers.google.com/calendar/api' },
    ],
  },
  highlevel: {
    provider: 'highlevel',
    overview: 'Connect your GoHighLevel account to sync appointments and calendar events.',
    prerequisites: [
      'A GoHighLevel account',
      'API Key from your GoHighLevel account',
      'Location ID from your GoHighLevel account',
    ],
    steps: [
      {
        step: 1,
        title: 'Get Your API Key',
        description: 'Log in to your GoHighLevel account and navigate to Settings > Integrations > API.',
        details: [
          'Click "Generate API Key" if you don\'t have one',
          'Copy the API Key (keep it secure)',
        ],
      },
      {
        step: 2,
        title: 'Get Your Location ID',
        description: 'In GoHighLevel, go to Settings > Locations and copy the Location ID.',
        details: [
          'The Location ID is usually found in the URL or location settings',
          'It may be labeled as "Location ID" or "Account ID"',
        ],
      },
      {
        step: 3,
        title: 'Enter Credentials',
        description: 'In the connection form, enter your API Key and Location ID.',
        codeExample: 'API Key: ghl_xxxxxxxxxxxxx\nLocation ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
      },
      {
        step: 4,
        title: 'Test Connection',
        description: 'Click "Test Connection" to verify your credentials work.',
      },
    ],
    troubleshooting: [
      {
        issue: 'Invalid API Key',
        solution: 'Verify the API key is correct and hasn\'t been revoked. Generate a new one if needed.',
      },
      {
        issue: 'Location ID not found',
        solution: 'Ensure you\'re using the correct Location ID from your GoHighLevel account settings.',
      },
    ],
    additionalResources: [
      { title: 'GoHighLevel API Documentation', url: 'https://highlevel.stoplight.io/docs/integrations' },
    ],
  },
  calendly: {
    provider: 'calendly',
    overview: 'Connect your Calendly account to sync bookings and events.',
    prerequisites: [
      'A Calendly account',
      'Calendly webhook URL or Account ID',
    ],
    steps: [
      {
        step: 1,
        title: 'Get Your Calendly Account ID',
        description: 'Log in to Calendly and navigate to Settings > Integrations.',
        details: [
          'Your Account ID can be found in the webhook settings',
          'Or use your Calendly username/account identifier',
        ],
      },
      {
        step: 2,
        title: 'Set Up Webhook (Optional)',
        description: 'Configure a webhook in Calendly to receive real-time updates.',
        details: [
          'Go to Calendly Settings > Integrations > Webhooks',
          'Add webhook URL: [Your Platform URL]/api/webhooks/calendly',
        ],
      },
      {
        step: 3,
        title: 'Enter Account Information',
        description: 'Enter your Calendly Account ID or webhook URL in the connection form.',
      },
      {
        step: 4,
        title: 'Test Connection',
        description: 'Click "Test Connection" to verify the setup.',
      },
    ],
    troubleshooting: [
      {
        issue: 'Webhook not receiving events',
        solution: 'Verify the webhook URL is correct and accessible from the internet.',
      },
    ],
  },
  outlook: {
    provider: 'outlook',
    overview: 'Connect your Microsoft Outlook/Office 365 calendar to sync events.',
    prerequisites: [
      'A Microsoft account (Outlook.com or Office 365)',
      'Calendar access permissions',
    ],
    steps: [
      {
        step: 1,
        title: 'Click "Connect Outlook"',
        description: 'Select "Microsoft Outlook" from the provider list.',
      },
      {
        step: 2,
        title: 'Authorize Access',
        description: 'You will be redirected to Microsoft to authorize calendar access.',
      },
      {
        step: 3,
        title: 'Select Calendar',
        description: 'Choose which Outlook calendar to sync (optional, defaults to primary).',
      },
      {
        step: 4,
        title: 'Test Connection',
        description: 'Verify the connection works correctly.',
      },
    ],
    troubleshooting: [
      {
        issue: 'OAuth fails',
        solution: 'Ensure you\'re using a valid Microsoft account and have granted necessary permissions.',
      },
    ],
  },
  apple: {
    provider: 'apple',
    overview: 'Connect your Apple Calendar (iCloud) using CalDAV protocol.',
    prerequisites: [
      'An Apple ID with iCloud Calendar enabled',
      'CalDAV server URL (usually automatically detected)',
    ],
    steps: [
      {
        step: 1,
        title: 'Enable iCloud Calendar',
        description: 'Ensure iCloud Calendar is enabled on your Apple device or iCloud.com.',
      },
      {
        step: 2,
        title: 'Get CalDAV Credentials',
        description: 'You\'ll need your iCloud email and an app-specific password.',
        details: [
          'Go to appleid.apple.com',
          'Generate an app-specific password for calendar access',
        ],
      },
      {
        step: 3,
        title: 'Enter CalDAV Information',
        description: 'Enter your iCloud email, app-specific password, and calendar path.',
        codeExample: 'Server: https://caldav.icloud.com\nUsername: your.email@icloud.com\nPassword: [app-specific password]',
      },
      {
        step: 4,
        title: 'Test Connection',
        description: 'Verify the CalDAV connection works.',
      },
    ],
    troubleshooting: [
      {
        issue: 'Authentication fails',
        solution: 'Use an app-specific password, not your regular Apple ID password.',
      },
      {
        issue: 'Cannot find calendar',
        solution: 'Verify the calendar path is correct. Default is usually "/" or "/calendars/".',
      },
    ],
  },
  custom: {
    provider: 'custom',
    overview: 'Connect a custom calendar system using iCal feed, CalDAV, or custom API.',
    prerequisites: [
      'Calendar system that supports iCal, CalDAV, or REST API',
      'Access credentials (if required)',
    ],
    steps: [
      {
        step: 1,
        title: 'Choose Connection Type',
        description: 'Select how you want to connect: iCal Feed, CalDAV, or Custom API.',
      },
      {
        step: 2,
        title: 'Enter Connection Details',
        description: 'Provide the required information based on your connection type.',
        details: [
          'iCal Feed: Enter the calendar feed URL',
          'CalDAV: Enter server URL, username, password, and calendar path',
          'Custom API: Enter API endpoint, authentication method, and credentials',
        ],
      },
      {
        step: 3,
        title: 'Configure Sync Settings',
        description: 'Set sync direction (pull, push, or bidirectional) and sync frequency.',
      },
      {
        step: 4,
        title: 'Test Connection',
        description: 'Verify the custom connection works correctly.',
      },
    ],
    troubleshooting: [
      {
        issue: 'iCal feed not accessible',
        solution: 'Ensure the feed URL is publicly accessible or use authentication.',
      },
      {
        issue: 'CalDAV connection fails',
        solution: 'Verify server URL, credentials, and calendar path are correct.',
      },
    ],
  },
};

/**
 * Get instructions for a specific provider
 */
export function getProviderInstructions(provider: CalendarProviderType): ProviderInstructions {
  return instructions[provider] || instructions.custom;
}

/**
 * Get all available instructions
 */
export function getAllInstructions(): Record<CalendarProviderType, ProviderInstructions> {
  return instructions;
}
