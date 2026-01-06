import { config } from 'dotenv';

// Load .env first, then .env.local (doesn't overwrite existing variables)
config();
config({ path: '.env.local', override: false });

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
