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
 * - GOOGLE_SERVICE_ACCOUNT_JSON_B64=<base64 JSON> (recommended on platforms that struggle with multiline secrets)
 */
function looksLikeJsonObject(text: string): boolean {
  const t = text.trim();
  return t.startsWith('{') && t.endsWith('}');
}

function resolveServiceAccountJsonFromEnv(): string | undefined {
  const direct = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (direct && looksLikeJsonObject(direct)) return direct;

  const b64OrJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_B64?.trim();
  if (!b64OrJson) return undefined;

  // Common misconfiguration: raw JSON pasted into the *_B64 field.
  if (looksLikeJsonObject(b64OrJson)) return b64OrJson;

  const decoded = Buffer.from(b64OrJson, 'base64').toString('utf8').trim();
  if (decoded && looksLikeJsonObject(decoded)) return decoded;

  console.warn(
    '⚠️ Invalid GOOGLE_SERVICE_ACCOUNT_JSON_B64: value did not decode to JSON. ' +
      'If you pasted raw JSON, use GOOGLE_SERVICE_ACCOUNT_JSON instead, or base64-encode it first.'
  );
  return undefined;
}

const serviceAccountJson = resolveServiceAccountJsonFromEnv();

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && serviceAccountJson) {
  try {
    // Validate JSON before writing
    let parsedJson: any;
    try {
      parsedJson = JSON.parse(serviceAccountJson);
    } catch (parseError) {
      console.error('❌ Invalid JSON in service account credentials:', parseError instanceof Error ? parseError.message : parseError);
      throw new Error('Service account JSON is not valid JSON');
    }
    
    // Check for required fields
    if (!parsedJson.type || parsedJson.type !== 'service_account') {
      console.warn('⚠️ Service account JSON missing or incorrect "type" field (expected "service_account")');
    }
    if (!parsedJson.project_id) {
      console.warn('⚠️ Service account JSON missing "project_id" field');
    }
    if (!parsedJson.private_key) {
      console.warn('⚠️ Service account JSON missing "private_key" field');
    }
    if (!parsedJson.client_email) {
      console.warn('⚠️ Service account JSON missing "client_email" field');
    }
    
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'google-creds-'));
    const credsPath = path.join(tmpDir, 'google-service-account.json');
    fs.writeFileSync(credsPath, serviceAccountJson, { encoding: 'utf8', mode: 0o600 });
    process.env.GOOGLE_APPLICATION_CREDENTIALS = credsPath;
    console.log('🔐 Google credentials loaded from env (temp file created)');
    console.log(`   Project ID: ${parsedJson.project_id || 'NOT SET'}`);
    console.log(`   Client Email: ${parsedJson.client_email || 'NOT SET'}`);
    console.log(`   Credentials file: ${credsPath}`);
    const cleanup = () => {
      try {
        fs.unlinkSync(credsPath);
      } catch {
        // ignore
      }
      try {
        fs.rmdirSync(tmpDir);
      } catch {
        // ignore
      }
    };
    process.on('exit', cleanup);
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
  } catch (e) {
    console.error(
      '❌ Failed to write service account JSON to temp file; Google ADC may not work:',
      e instanceof Error ? e.message : e
    );
  }
} else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.log(`🔐 Using existing GOOGLE_APPLICATION_CREDENTIALS: ${process.env.GOOGLE_APPLICATION_CREDENTIALS}`);
  // Verify file exists
  if (!fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
    console.error(`❌ GOOGLE_APPLICATION_CREDENTIALS file does not exist: ${process.env.GOOGLE_APPLICATION_CREDENTIALS}`);
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
console.log(`🪙 Gemini API Key: ${process.env.GEMINI_API_KEY ? '✅ Available' : '❌ Not found'}`);
console.log(`🔄 Gemini fallback to API key: ${process.env.GEMINI_FALLBACK_TO_API_KEY === 'true' ? 'enabled' : 'disabled'}`);