import { config } from 'dotenv';

// Load .env first, then .env.local (doesn't overwrite existing variables)
config();
config({ path: '.env.local', override: false });

/**
 * Normalize environment variable names across hosts.
 * Never log secret values; only log presence/absence.
 */
function normalizeEnv() {
  // Some hosts use different names; normalize to OPENAI_API_KEY for server-side usage.
  const openAIKey =
    process.env.OPENAI_API_KEY ||
    process.env.OPENAI_KEY ||
    process.env.OPENAI_APIKEY ||
    process.env.OPENAI_TOKEN;

  if (!process.env.OPENAI_API_KEY && openAIKey) {
    process.env.OPENAI_API_KEY = openAIKey;
  }

  const langsmithKey =
    process.env.LANGSMITH_API_KEY ||
    process.env.LANGCHAIN_API_KEY ||
    process.env.LANGSMITH_KEY;

  if (!process.env.LANGSMITH_API_KEY && langsmithKey) {
    process.env.LANGSMITH_API_KEY = langsmithKey;
  }

  // Some setups set LANGCHAIN_PROJECT; normalize to LANGSMITH_PROJECT for our codebase.
  if (!process.env.LANGSMITH_PROJECT && process.env.LANGCHAIN_PROJECT) {
    process.env.LANGSMITH_PROJECT = process.env.LANGCHAIN_PROJECT;
  }
}

normalizeEnv();

console.log('🔧 Environment configuration loaded from .env and .env.local');
console.log(`🔐 OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? 'configured' : 'missing'}`);
