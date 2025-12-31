import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import { existsSync, mkdirSync } from 'fs';
import { createRequire } from "module";
import * as schema from "@shared/schema";
import * as sqliteSchema from "@shared/schema-sqlite";

neonConfig.webSocketConstructor = ws;

// Support both local SQLite development and production PostgreSQL
let db: any;

const env = process.env.NODE_ENV ?? 'development';

const hasDatabaseUrl = !!process.env.DATABASE_URL;
const require = createRequire(import.meta.url);

if (env !== 'development' && hasDatabaseUrl) {
  // connect to Postgres using process.env.DATABASE_URL
  console.log('🚀 Using PostgreSQL database for production');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle({ client: pool, schema });
} else {
  // Use SQLite file in a local path that always exists
  const file = process.env.SQLITE_FILE ?? './.data/dev.sqlite';
  // ensure folder exists, then connect to sqlite at `file`
  const dir = file.substring(0, file.lastIndexOf('/'));
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  if (env !== 'development' && !hasDatabaseUrl) {
    console.warn('⚠️ DATABASE_URL not set; falling back to local SQLite database');
  } else {
    console.log('🔧 Using local SQLite database for development');
  }
  // Load SQLite-only dependencies lazily so production deploys (Postgres) don't require native builds.
  const Database = require("better-sqlite3") as typeof import("better-sqlite3");
  const { drizzle: drizzleSQLite } = require("drizzle-orm/better-sqlite3") as typeof import("drizzle-orm/better-sqlite3");
  const sqlite = new Database(file);
  db = drizzleSQLite(sqlite, { schema: sqliteSchema });
}

export { db };