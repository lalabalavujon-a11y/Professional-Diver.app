#!/usr/bin/env tsx
/**
 * Helper script to verify your DATABASE_URL format
 * 
 * Usage:
 *   tsx scripts/verify-database-url.ts [connection-string]
 * 
 * Or set DATABASE_URL and run:
 *   DATABASE_URL='your-string' tsx scripts/verify-database-url.ts
 */

const connectionString = process.argv[2] || process.env.DATABASE_URL;

if (!connectionString) {
  console.log('❌ No connection string provided');
  console.log('');
  console.log('Usage:');
  console.log('  tsx scripts/verify-database-url.ts "postgresql://..."');
  console.log('  or');
  console.log('  DATABASE_URL="postgresql://..." tsx scripts/verify-database-url.ts');
  console.log('');
  console.log('To get your Supabase connection string:');
  console.log('  1. Go to https://supabase.com/dashboard');
  console.log('  2. Select your project');
  console.log('  3. Settings → Database');
  console.log('  4. Copy the "URI" connection string');
  process.exit(1);
}

// Validate format
const postgresPattern = /^postgresql:\/\/[^:]+:[^@]+@[^:]+:\d+\/[^?]+(\?.*)?$/;
const isValidFormat = postgresPattern.test(connectionString);

console.log('🔍 Validating connection string format...\n');

if (!isValidFormat) {
  console.log('❌ Invalid connection string format');
  console.log('');
  console.log('Expected format:');
  console.log('  postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require');
  console.log('');
  console.log('Example:');
  console.log('  postgresql://postgres:password@db.xxx.supabase.co:5432/postgres?sslmode=require');
  console.log('');
  console.log('Your string (first 50 chars):');
  console.log(`  ${connectionString.substring(0, 50)}...`);
  process.exit(1);
}

// Parse the connection string
try {
  const url = new URL(connectionString);
  
  console.log('✅ Connection string format is valid!\n');
  console.log('📊 Connection Details:');
  console.log(`   Protocol: ${url.protocol.replace(':', '')}`);
  console.log(`   Username: ${url.username || 'not specified'}`);
  console.log(`   Password: ${url.password ? '***' + url.password.slice(-2) : 'not specified'}`);
  console.log(`   Host: ${url.hostname}`);
  console.log(`   Port: ${url.port || '5432 (default)'}`);
  console.log(`   Database: ${url.pathname.replace('/', '')}`);
  console.log(`   SSL Mode: ${url.searchParams.get('sslmode') || 'not specified'}`);
  console.log('');
  
  // Check for Supabase-specific patterns
  if (url.hostname.includes('supabase.co')) {
    console.log('✅ Detected Supabase database');
    
    if (url.hostname.includes('pooler')) {
      console.log('   Using connection pooling (recommended)');
    } else {
      console.log('   Using direct connection');
      console.log('   💡 Tip: Consider using connection pooling for better performance');
    }
    
    if (!url.searchParams.get('sslmode')) {
      console.log('   ⚠️  Warning: sslmode not specified. Supabase requires SSL.');
      console.log('   Add ?sslmode=require to your connection string');
    }
  }
  
  console.log('');
  console.log('🚀 Ready to use! You can now run:');
  console.log('   npm run db:migrate:rls');
  console.log('');
  console.log('Or set it as an environment variable:');
  console.log(`   export DATABASE_URL='${connectionString}'`);
  
} catch (error) {
  console.log('❌ Error parsing connection string:');
  console.log(`   ${error}`);
  process.exit(1);
}
