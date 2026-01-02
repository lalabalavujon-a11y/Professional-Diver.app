import { existsSync, mkdirSync } from 'fs';
import { createRequire } from "module";
import * as schema from "@shared/schema";
import * as sqliteSchema from "@shared/schema-sqlite";

// Support both local SQLite development and production PostgreSQL
let db: any;

const env = process.env.NODE_ENV ?? 'development';

const databaseUrl = process.env.DATABASE_URL;
const hasDatabaseUrl = !!databaseUrl;
const require = createRequire(import.meta.url);

if (env !== 'development' && hasDatabaseUrl) {
  const hostname = (() => {
    try {
      return new URL(databaseUrl!).hostname;
    } catch {
      return "";
    }
  })();

  const isNeon =
    hostname.endsWith("neon.tech") ||
    hostname.endsWith("neon.build") ||
    hostname.includes("neon");

  // connect to Postgres using process.env.DATABASE_URL
  console.log(`🚀 Using PostgreSQL database for production (${isNeon ? "neon-serverless" : "node-postgres"})`);

  if (isNeon) {
    const { Pool, neonConfig } = require("@neondatabase/serverless") as typeof import("@neondatabase/serverless");
    const { drizzle } = require("drizzle-orm/neon-serverless") as typeof import("drizzle-orm/neon-serverless");
    const ws = require("ws") as typeof import("ws");
    neonConfig.webSocketConstructor = ws;

    const pool = new Pool({ connectionString: databaseUrl });
    db = drizzle({ client: pool, schema });
  } else {
    // Supabase (and most managed Postgres) expects TLS. `pg` doesn't reliably honor `sslmode=require`
    // in the connection string, so we explicitly enable SSL for non-local hosts.
    //
    // Additionally, some Railway regions have broken/blocked IPv6 egress while Supabase resolves to AAAA first.
    // Force IPv4 at the TCP level with `family: 4` to avoid ENETUNREACH on IPv6 addresses.
    const { Pool } = require("pg") as typeof import("pg");
    const { drizzle } = require("drizzle-orm/node-postgres") as typeof import("drizzle-orm/node-postgres");

    const ssl =
      hostname.endsWith(".supabase.co") || hostname.endsWith(".supabase.com") || hostname !== "localhost"
        ? { rejectUnauthorized: false }
        : undefined;

    const url = new URL(databaseUrl!);
    const pool = new Pool({
      host: url.hostname,
      port: url.port ? Number(url.port) : 5432,
      user: url.username || undefined,
      password: url.password || undefined,
      database: url.pathname?.replace(/^\//, "") || undefined,
      ssl,
      family: 4,
    });
    db = drizzle(pool, { schema });
  }
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