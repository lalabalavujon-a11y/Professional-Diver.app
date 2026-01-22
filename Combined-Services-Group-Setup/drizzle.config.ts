import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./migrations",
  schema: process.env.NODE_ENV === 'development' && !process.env.DATABASE_URL ? "./shared/schema-sqlite.ts" : "./shared/schema.ts",
  dialect: process.env.NODE_ENV === 'development' && !process.env.DATABASE_URL ? "sqlite" : "postgresql",
  dbCredentials: process.env.NODE_ENV === 'development' && !process.env.DATABASE_URL ? {
    url: "./.data/dev.sqlite",
  } : {
    url: process.env.DATABASE_URL || "",
  },
});
