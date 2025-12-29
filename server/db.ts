import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzleSQLite } from 'drizzle-orm/better-sqlite3';
import { drizzle as drizzleD1 } from 'drizzle-orm/d1';
import Database from 'better-sqlite3';
import ws from "ws";
import * as schema from "@shared/schema";
import * as schemaSQLite from "@shared/schema-sqlite";
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

neonConfig.webSocketConstructor = ws;

// Support multiple database backends:
// 1. D1 (Cloudflare Workers) - preferred for production
// 2. PostgreSQL (via DATABASE_URL) - fallback for production
// 3. SQLite (local development)
let db: any;

// Check if we're in a Cloudflare Workers environment with D1 binding
// D1 binding is available as a global or passed via environment
const isCloudflareWorker = typeof globalThis !== 'undefined' && 
  (globalThis as any).DB !== undefined;

// Check if D1 database is available (Cloudflare Workers)
if (isCloudflareWorker && (globalThis as any).DB) {
  const d1Database = (globalThis as any).DB as D1Database;
  console.log('🚀 Using Cloudflare D1 database');
  db = drizzleD1(d1Database, { schema: schemaSQLite });
} else {
  const env = process.env.NODE_ENV ?? 'development';
  
  if (env !== 'development') {
    // Production: Try PostgreSQL first, fall back to D1 if available
    if (process.env.DATABASE_URL) {
      console.log('🚀 Using PostgreSQL database for production');
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });
      db = drizzle({ client: pool, schema });
    } else {
      // No DATABASE_URL - check if we can use D1
      // This handles cases where D1 is passed via function parameter
      console.log('⚠️  No DATABASE_URL found. D1 will be used if available in Cloudflare Workers.');
      // Will be set via setDatabase() if D1 is available
      db = null;
    }
  } else {
    // Development: Use local SQLite
    try {
      const dbPath = path.join(__dirname, '..', 'local-dev.db');
      console.log(`🔧 Using SQLite database: ${dbPath}`);
      const sqlite = new Database(dbPath);
      sqlite.pragma('journal_mode = WAL');
      db = drizzleSQLite(sqlite, { schema: schemaSQLite });
      console.log('✅ SQLite database connected successfully');
    } catch (error) {
      console.error('❌ Failed to connect to SQLite database:', error);
      console.log('⚠️ Falling back to mock database');
      // Fallback to mock if SQLite fails
      db = {
        get: async (query: string) => {
          console.log('Mock DB query:', query);
          return { result: 'ok' };
        },
        select: () => ({
          from: () => ({
            where: () => ({
              limit: () => Promise.resolve([])
            })
          })
        }),
        insert: () => ({
          values: () => Promise.resolve({ insertId: 1 })
        }),
        update: () => ({
          set: () => ({
            where: () => Promise.resolve({ changes: 1 })
          })
        }),
        delete: () => ({
          where: () => Promise.resolve({ changes: 1 })
        })
      };
    }
  }
}

/**
 * Set database instance for D1 (used when D1 binding is passed from Cloudflare Worker)
 * @param d1Database - D1Database binding from Cloudflare Worker
 */
export function setDatabase(d1Database: D1Database) {
  console.log('🚀 Setting D1 database from Cloudflare Worker binding');
  db = drizzleD1(d1Database, { schema: schemaSQLite });
}

/**
 * Initialize database with D1 binding (for Cloudflare Workers)
 * @param d1Database - D1Database binding from Cloudflare Worker environment
 */
export function initDatabase(d1Database?: D1Database) {
  if (d1Database) {
    console.log('🚀 Initializing with D1 database');
    db = drizzleD1(d1Database, { schema: schemaSQLite });
    return db;
  }
  return db;
}

export { db };
