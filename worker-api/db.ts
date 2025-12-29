/**
 * Cloudflare D1 Database Connection for Worker API
 * Uses drizzle-orm with D1 adapter
 */

import { drizzle } from 'drizzle-orm/d1';
import * as schema from '@shared/schema-sqlite';

/**
 * Get database instance from D1 binding
 * @param db - D1Database binding from Cloudflare Worker environment
 * @returns Drizzle database instance
 */
export function getDatabase(db: D1Database) {
  return drizzle(db, { schema });
}

/**
 * Type helper for database instance
 */
export type Database = ReturnType<typeof getDatabase>;





