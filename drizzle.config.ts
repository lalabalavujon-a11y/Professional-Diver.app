import { defineConfig } from "drizzle-kit";

// SSL configuration: always enable SSL, toggle certificate verification
// staging/dev: rejectUnauthorized=false (accepts self-signed certificates)
// production: set DB_SSL_REJECT_UNAUTHORIZED=true for strict validation
const rejectUnauthorized = process.env.DB_SSL_REJECT_UNAUTHORIZED === "true";

export default defineConfig({
  out: "./migrations",
  schema: process.env.NODE_ENV === 'development' && !process.env.DATABASE_URL ? "./shared/schema-sqlite.ts" : "./shared/schema.ts",
  dialect: process.env.NODE_ENV === 'development' && !process.env.DATABASE_URL ? "sqlite" : "postgresql",
  dbCredentials: process.env.NODE_ENV === 'development' && !process.env.DATABASE_URL ? {
    url: "./local-dev.db",
  } : {
    url: process.env.DATABASE_URL || "",
    // Always enable SSL, control certificate verification via env var
    ssl: { rejectUnauthorized },
  },
});
