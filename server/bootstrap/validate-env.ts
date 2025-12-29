/**
 * Environment variable validation
 * Validates required environment variables at application startup
 */

const REQUIRED_VARS = [
  // Core application
  // Note: DATABASE_URL is only required in production
];

const REQUIRED_FOR_PRODUCTION = [
  'DATABASE_URL',
];

const OPTIONAL_BUT_RECOMMENDED = [
  'OPENAI_API_KEY',
  'SESSION_SECRET',
  'SENDGRID_API_KEY',
  'SMTP_HOST',
];

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate environment variables
 */
export function validateEnvironment(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const isProduction = process.env.NODE_ENV === 'production';

  // Check required variables
  for (const varName of REQUIRED_VARS) {
    if (!process.env[varName]) {
      errors.push(`Missing required environment variable: ${varName}`);
    }
  }

  // Check production-specific requirements
  if (isProduction) {
    for (const varName of REQUIRED_FOR_PRODUCTION) {
      if (!process.env[varName]) {
        errors.push(`Missing required production environment variable: ${varName}`);
      }
    }

    // Validate DATABASE_URL format if provided
    if (process.env.DATABASE_URL) {
      if (!process.env.DATABASE_URL.startsWith('postgresql://')) {
        errors.push('DATABASE_URL must be a PostgreSQL connection string (postgresql://...)');
      }
    }

    // Check for session secret
    if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
      warnings.push('SESSION_SECRET should be at least 32 characters long for production security');
    }

    // Check for email configuration
    if (!process.env.SENDGRID_API_KEY && (!process.env.SMTP_HOST || !process.env.SMTP_USER)) {
      warnings.push('Email configuration missing (SENDGRID_API_KEY or SMTP settings). Email features will not work.');
    }
  }

  // Check recommended variables
  for (const varName of OPTIONAL_BUT_RECOMMENDED) {
    if (!process.env[varName] && isProduction) {
      warnings.push(`Recommended environment variable not set: ${varName}`);
    }
  }

  // Validate AI services if OpenAI is set
  if (process.env.OPENAI_API_KEY && !process.env.LANGSMITH_API_KEY) {
    warnings.push('LANGSMITH_API_KEY not set. LangChain tracing will be limited.');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate and exit if critical errors
 */
export function validateEnvironmentOrExit(): void {
  const result = validateEnvironment();

  if (result.errors.length > 0) {
    console.error('\n❌ Environment Validation Failed:\n');
    result.errors.forEach((error) => {
      console.error(`  • ${error}`);
    });
    console.error('\nPlease set the required environment variables and try again.\n');
    console.error('See .env.example for required variables.\n');
    process.exit(1);
  }

  if (result.warnings.length > 0) {
    console.warn('\n⚠️  Environment Validation Warnings:\n');
    result.warnings.forEach((warning) => {
      console.warn(`  • ${warning}`);
    });
    console.warn('');
  }

  if (result.valid && result.warnings.length === 0) {
    console.log('✅ Environment variables validated successfully\n');
  }
}




