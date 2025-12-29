import { config } from 'dotenv';

// Load .env first, then .env.local (doesn't overwrite existing variables)
config();
config({ path: '.env.local', override: false });

console.log('🔧 Environment configuration loaded from .env and .env.local');
