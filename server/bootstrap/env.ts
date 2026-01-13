import { config } from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

// Load .env first, then .env.local (doesn't overwrite existing variables)
config();
config({ path: '.env.local', override: false });

/**
 * Google Auth bootstrap (Railway-friendly):
 *
 * Gemini Live WebSocket may require OAuth2 (API keys can be rejected depending on the API).
 * On platforms like Railway, the easiest secure approach is to store a service account JSON
 * in an environment variable and write it to a temp file at runtime so Google libraries
 * can use Application Default Credentials (ADC).
 *
 * Set one of:
 * - GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json (file already on disk)
 * - GOOGLE_SERVICE_ACCOUNT_JSON=<full JSON contents> (this bootstrap will write a temp file)
 */
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
  try {
    const tmpDir = os.tmpdir();
    const credsPath = path.join(tmpDir, 'google-service-account.json');
    fs.writeFileSync(credsPath, process.env.GOOGLE_SERVICE_ACCOUNT_JSON, { encoding: 'utf8' });
    process.env.GOOGLE_APPLICATION_CREDENTIALS = credsPath;
    console.log('🔐 Google credentials loaded from GOOGLE_SERVICE_ACCOUNT_JSON (temp file created)');
  } catch (e) {
    console.warn(
      '⚠️ Failed to write GOOGLE_SERVICE_ACCOUNT_JSON to temp file; Google ADC may not work:',
      e instanceof Error ? e.message : e
    );
  }
}

// HighLevel CRM Configuration (optional)
export const GHL_API_KEY = process.env.GHL_API_KEY;
export const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;
export const CRM_MODE = process.env.CRM_MODE || 'local'; // 'local' | 'highlevel' | 'dual'

// Validate HighLevel config if mode requires it
if (CRM_MODE === 'highlevel' || CRM_MODE === 'dual') {
  if (!GHL_API_KEY || !GHL_LOCATION_ID) {
    console.warn('⚠️  HighLevel mode enabled but GHL_API_KEY or GHL_LOCATION_ID not configured');
  }
}

console.log('🔧 Environment configuration loaded from .env and .env.local');
console.log(`📊 CRM Mode: ${CRM_MODE}${GHL_API_KEY ? ' (HighLevel configured)' : ' (HighLevel not configured)'}`);
console.log(`🌊 Stormglass API: ${process.env.STORMGLASS_API_KEY ? '✅ Configured' : '❌ Not configured'}`);
console.log(`🤖 OpenAI API Key: ${process.env.OPENAI_API_KEY ? '✅ Available' : '❌ Not found'}`);
console.log(`🔍 LangSmith API Key: ${process.env.LANGSMITH_API_KEY ? '✅ Available' : '❌ Not found'}`);
