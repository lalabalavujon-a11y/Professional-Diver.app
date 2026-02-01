/**
 * Safe migration runner for Railway deployments
 * 
 * Only runs migrations if:
 * 1. DATABASE_URL is set and points to PostgreSQL
 * 2. Database is reachable
 * 3. RUN_MIGRATIONS_ON_START is not explicitly set to 'false'
 * 
 * This prevents restart loops from migration failures and avoids
 * running migrations on SQLite or when DB is unreachable.
 */

import { execSync } from 'child_process';

/**
 * Redact sensitive information from DATABASE_URL
 */
function redactDatabaseUrl(url?: string): string | undefined {
  if (!url) return undefined;
  try {
    const u = new URL(url);
    if (u.password) u.password = '****';
    return u.toString();
  } catch {
    // If it's not a valid URL, don't echo it back (could still contain secrets)
    return '[unparseable DATABASE_URL]';
  }
}

/**
 * Validate DATABASE_URL format before attempting connection
 */
function validateDatabaseUrl(url?: string): string[] {
  if (!url) return ['DATABASE_URL is missing'];
  const issues: string[] = [];
  if (!url.startsWith('postgres://') && !url.startsWith('postgresql://')) {
    issues.push('DATABASE_URL must start with postgresql:// (or postgres://)');
  }
  if (!url.includes('sslmode=')) {
    issues.push('DATABASE_URL should include ?sslmode=require');
  }
  return issues;
}

/**
 * Format connection error with structured diagnostics
 */
function formatConnError(err: unknown) {
  const e = err as any;

  // Base message
  const message =
    err instanceof Error
      ? err.message
      : typeof err === 'string'
        ? err
        : 'unknown error';

  // Node network errors often have these fields
  const net = {
    code: e?.code,
    errno: e?.errno,
    syscall: e?.syscall,
    address: e?.address,
    port: e?.port,
    hostname: e?.hostname,
  };

  // pg / postgres errors often have these fields
  const pg = {
    severity: e?.severity,
    sqlstate: e?.code, // pg uses `code` as SQLSTATE
    detail: e?.detail,
    hint: e?.hint,
    position: e?.position,
    where: e?.where,
    schema: e?.schema,
    table: e?.table,
    column: e?.column,
    constraint: e?.constraint,
    routine: e?.routine,
  };

  // Prisma sometimes nests details
  const prisma = {
    name: e?.name,
    clientVersion: e?.clientVersion,
    prismaCode: e?.code, // e.g. P1001/P1002 etc
    meta: e?.meta,
    cause: e?.cause,
  };

  return { message, net, pg, prisma };
}

/**
 * Infer actionable hints from error type
 */
function inferHints(err: unknown): string[] {
  const e = err as any;
  const msg = (err instanceof Error ? err.message : String(err || '')).toLowerCase();
  const code = String(e?.code || '').toUpperCase();

  const hints: string[] = [];

  // Network / reachability
  if (
    code === 'ENOTFOUND' ||
    code === 'EAI_AGAIN' ||
    msg.includes('getaddrinfo') ||
    msg.includes('dns')
  ) {
    hints.push('DNS resolution failure: check hostname in DATABASE_URL and platform DNS/network.');
  }

  if (code === 'ETIMEDOUT' || msg.includes('timeout')) {
    hints.push('Connection timed out: often network egress/IP allowlist, wrong host, or using non-routable direct connection.');
  }

  if (code === 'ECONNREFUSED') {
    hints.push('Connection refused: wrong host/port, server not reachable, or pooler/direct mismatch.');
  }

  // TLS/SSL
  if (msg.includes('ssl') || msg.includes('tls') || msg.includes('certificate')) {
    hints.push('TLS/SSL issue: ensure ?sslmode=require (or correct SSL settings) and that your runtime supports the required TLS.');
  }

  // Authentication
  if (msg.includes('password authentication failed') || msg.includes('authentication failed') || msg.includes('28p01')) {
    hints.push('Auth failed: verify DB password/user. If password has special chars, URL-encode it.');
  }

  // Supabase / Railway IPv4 pooler suspicion
  if (msg.includes('no route to host') || msg.includes('network is unreachable') || msg.includes('ehostunreach')) {
    hints.push('Network unreachable: if your host is IPv4-only (common on some PaaS), use Supabase Session Pooler instead of Direct connection.');
  }

  // Generic actionable hint
  hints.push('Check: DATABASE_URL format, password, network access, and IPv4 compatibility. Prefer Supabase Session Pooler on IPv4-only platforms.');

  return hints;
}

const databaseUrl = process.env.DATABASE_URL || '';
const runMigrations = process.env.RUN_MIGRATIONS_ON_START !== 'false';
const isPostgres = databaseUrl.startsWith('postgresql://') || databaseUrl.startsWith('postgres://');

console.log('🔍 Migration check:');
console.log(`   DATABASE_URL present: ${!!databaseUrl}`);
if (databaseUrl) {
  console.log(`   DATABASE_URL (redacted): ${redactDatabaseUrl(databaseUrl)}`);
}
console.log(`   Is PostgreSQL: ${isPostgres}`);
console.log(`   RUN_MIGRATIONS_ON_START: ${process.env.RUN_MIGRATIONS_ON_START || 'not set (default: true)'}`);

// Validate DATABASE_URL format early
if (databaseUrl) {
  const validationIssues = validateDatabaseUrl(databaseUrl);
  if (validationIssues.length > 0) {
    console.error('❌ DATABASE_URL validation failed:');
    validationIssues.forEach(issue => console.error(`   - ${issue}`));
    process.exit(1);
  }
}

if (!runMigrations) {
  console.log('⏭️  Skipping migrations: RUN_MIGRATIONS_ON_START=false');
  process.exit(0);
}

if (!databaseUrl) {
  console.log('⏭️  Skipping migrations: DATABASE_URL not set (using SQLite)');
  process.exit(0);
}

if (!isPostgres) {
  console.log('⏭️  Skipping migrations: DATABASE_URL does not point to PostgreSQL');
  process.exit(0);
}

// Test database connectivity before running migrations
console.log('🔌 Testing database connectivity...');
try {
  // Import db to test connection
  const { db } = await import('../server/db.js');
  const { sql } = await import('drizzle-orm');
  
  if (typeof (db as any).execute === 'function') {
    await db.execute(sql`SELECT 1`);
    console.log('✅ Database is reachable');
  } else {
    console.log('⚠️  Database connection method not available');
    process.exit(1);
  }
} catch (error) {
  const details = formatConnError(error);
  const hints = inferHints(error);

  console.error('❌ Database connectivity test failed');
  console.error('   Message:', details.message);

  // Important: log a REDACTED URL only
  console.error('   DATABASE_URL:', redactDatabaseUrl(databaseUrl));

  // Print structured details (safe fields)
  if (Object.values(details.net).some(v => v !== undefined)) {
    console.error('   Network details:', details.net);
  }
  if (Object.values(details.pg).some(v => v !== undefined)) {
    console.error('   Postgres details:', details.pg);
  }
  if (Object.values(details.prisma).some(v => v !== undefined)) {
    console.error('   Prisma details:', details.prisma);
  }

  // Print actionable hints
  for (const h of hints) {
    console.error('💡', h);
  }

  // If you want the original stack trace without leaking envs:
  if (error instanceof Error && error.stack) {
    console.error('   Stack:', error.stack);
  }

  console.error('⏭️  Skipping migrations to prevent restart loop');
  process.exit(1);
}

// Run migrations
console.log('🚀 Running database migrations...');
try {
  execSync('npm run db:migrate', { stdio: 'inherit' });
  console.log('✅ Migrations completed successfully');
  process.exit(0);
} catch (error) {
  console.error('❌ Migration failed:', error instanceof Error ? error.message : 'unknown');
  console.error('⚠️  Exiting with error - app will not start until migrations succeed');
  process.exit(1);
}
