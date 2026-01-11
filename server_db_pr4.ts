import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzleSQLite } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import ws from "ws";
import { existsSync, mkdirSync } from 'fs';
import * as schema from "@shared/schema";
import * as sqliteSchema from "@shared/schema-sqlite";

neonConfig.webSocketConstructor = ws;

// Support both local SQLite development and production PostgreSQL
let db: any;

const env = process.env.NODE_ENV ?? 'development';

if (env !== 'development') {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL must be set for production. Did you forget to provision a database?');
  }
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
  console.log('🔧 Using local SQLite database for development');
  const sqlite = new Database(file);
  db = drizzleSQLite(sqlite, { schema: sqliteSchema });
}

export { db };