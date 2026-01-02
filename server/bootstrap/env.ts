import { config } from 'dotenv';
import dns from "dns";

// Load .env first, then .env.local (doesn't overwrite existing variables)
config();
config({ path: '.env.local', override: false });

// Prefer IPv4 when both A and AAAA exist (fixes ENETUNREACH in some hosted networks).
try {
  dns.setDefaultResultOrder("ipv4first");
} catch {
  // Older Node versions may not support this; ignore.
}

console.log('🔧 Environment configuration loaded from .env and .env.local');
