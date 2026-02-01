import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./migrations",
  schema: process.env.NODE_ENV === 'development' && !process.env.DATABASE_URL ? "./shared/schema-sqlite.ts" : "./shared/schema.ts",
  dialect: process.env.NODE_ENV === 'development' && !process.env.DATABASE_URL ? "sqlite" : "postgresql",
  dbCredentials: process.env.NODE_ENV === 'development' && !process.env.DATABASE_URL ? {
    url: "./local-dev.db",
  } : {
    url: process.env.DATABASE_URL || "",
    // SSL configuration for pg driver (used by drizzle-kit migrate)
    // For staging/dev: accept self-signed certificates
    // For production: can be controlled via DB_SSL_REJECT_UNAUTHORIZED env var
    ssl: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true' 
      ? { rejectUnauthorized: true }  // Strict SSL validation for production
      : { rejectUnauthorized: false }  // Accept self-signed certificates for staging/dev
  },
});
