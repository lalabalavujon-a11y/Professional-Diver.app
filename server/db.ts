import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import { existsSync, mkdirSync } from 'fs';
import { createRequire } from "module";
import * as schema from "@shared/schema";
import * as sqliteSchema from "@shared/schema-sqlite";
import * as sponsorSchema from "@shared/sponsor-schema";
import * as sponsorSqliteSchema from "@shared/sponsor-schema-sqlite";

neonConfig.webSocketConstructor = ws;

// Support both local SQLite development and production PostgreSQL
let db: any;

const env = process.env.NODE_ENV ?? 'development';

const hasDatabaseUrl = !!process.env.DATABASE_URL;
const usePostgres = hasDatabaseUrl && process.env.USE_SQLITE !== 'true';
const databaseUrl = process.env.DATABASE_URL;
const require = createRequire(import.meta.url);

if (usePostgres) {
  // connect to Postgres using process.env.DATABASE_URL
  console.log(`🚀 Using PostgreSQL database (${env})`);
  const connectionString = databaseUrl
    ? (() => {
        const shouldRequireSsl = process.env.DATABASE_SSL !== 'false';
        if (!shouldRequireSsl) {
          return databaseUrl;
        }
        try {
          const url = new URL(databaseUrl);
          if (!url.searchParams.has('sslmode')) {
            url.searchParams.set('sslmode', 'require');
          }
          return url.toString();
        } catch {
          console.warn('⚠️ Unable to parse DATABASE_URL; using raw string.');
          if (databaseUrl.includes('sslmode=')) {
            return databaseUrl;
          }
          const separator = databaseUrl.includes('?') ? '&' : '?';
          return `${databaseUrl}${separator}sslmode=require`;
        }
      })()
    : undefined;
  const pool = new Pool({
    connectionString,
    ssl: process.env.DATABASE_SSL === 'false' ? undefined : { rejectUnauthorized: false },
  });
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
  // Store reference to SQLite instance for table creation
  (db as any).sqlite = sqlite;
}

const calendarSyncLogs = usePostgres
  ? schema.calendarSyncLogs
  : sqliteSchema.calendarSyncLogs;
const calendarConflicts = usePostgres
  ? schema.calendarConflicts
  : sqliteSchema.calendarConflicts;

export { calendarSyncLogs, calendarConflicts, db };
