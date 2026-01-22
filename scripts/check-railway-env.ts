#!/usr/bin/env tsx
/**
 * Check Railway environment variables configuration
 * This script helps identify missing or misconfigured environment variables
 * 
 * Usage:
 *   - Run locally to see what should be set: tsx scripts/check-railway-env.ts
 *   - Or use Railway CLI: railway run tsx scripts/check-railway-env.ts
 */

interface EnvVar {
  name: string;
  required: boolean;
  description: string;
  example?: string;
  category: 'critical' | 'important' | 'optional';
}

const envVars: EnvVar[] = [
  // Critical
  {
    name: 'NODE_ENV',
    required: true,
    description: 'Node environment (should be "production" on Railway)',
    example: 'production',
    category: 'critical'
  },
  {
    name: 'PORT',
    required: true,
    description: 'Server port (Railway auto-assigns, but verify it exists)',
    example: '5000',
    category: 'critical'
  },
  {
    name: 'DATABASE_URL',
    required: true,
    description: 'PostgreSQL connection string (REQUIRED for production)',
    example: 'postgresql://user:password@host:5432/database?sslmode=require',
    category: 'critical'
  },
  
  // Important
  {
    name: 'OPENAI_API_KEY',
    required: false,
    description: 'OpenAI API key for AI features',
    example: 'sk-...',
    category: 'important'
  },
  {
    name: 'LANGSMITH_API_KEY',
    required: false,
    description: 'LangSmith API key for AI observability',
    example: 'lsv2_...',
    category: 'important'
  },
  {
    name: 'LANGSMITH_PROJECT',
    required: false,
    description: 'LangSmith project name',
    example: 'professional-diver-training-app',
    category: 'important'
  },
  
  // Optional
  {
    name: 'STORMGLASS_API_KEY',
    required: false,
    description: 'Stormglass API key for weather data',
    category: 'optional'
  },
  {
    name: 'OPENWEATHER_API_KEY',
    required: false,
    description: 'OpenWeather API key',
    category: 'optional'
  },
  {
    name: 'GEMINI_API_KEY',
    required: false,
    description: 'Google Gemini API key',
    category: 'optional'
  },
  {
    name: 'GOOGLE_SERVICE_ACCOUNT_JSON',
    required: false,
    description: 'Google service account JSON (for calendar features)',
    category: 'optional'
  },
  {
    name: 'GOOGLE_SERVICE_ACCOUNT_JSON_B64',
    required: false,
    description: 'Base64-encoded Google service account JSON',
    category: 'optional'
  },
  {
    name: 'GHL_API_KEY',
    required: false,
    description: 'GoHighLevel API key (for CRM integration)',
    category: 'optional'
  },
  {
    name: 'GHL_LOCATION_ID',
    required: false,
    description: 'GoHighLevel location ID',
    category: 'optional'
  },
  {
    name: 'CRM_MODE',
    required: false,
    description: 'CRM mode: local, highlevel, or dual',
    example: 'local',
    category: 'optional'
  },
  {
    name: 'STRIPE_SECRET_KEY',
    required: false,
    description: 'Stripe secret key (for payments)',
    category: 'optional'
  },
  {
    name: 'STRIPE_PUBLISHABLE_KEY',
    required: false,
    description: 'Stripe publishable key',
    category: 'optional'
  },
  {
    name: 'STRIPE_WEBHOOK_SECRET',
    required: false,
    description: 'Stripe webhook signing secret',
    category: 'optional'
  },
  {
    name: 'SENDGRID_API_KEY',
    required: false,
    description: 'SendGrid API key (for email)',
    category: 'optional'
  },
];

function checkEnvVar(envVar: EnvVar): { present: boolean; valid: boolean; message: string } {
  const value = process.env[envVar.name];
  const present = !!value;
  
  if (!present) {
    return {
      present: false,
      valid: !envVar.required,
      message: envVar.required ? '❌ MISSING (REQUIRED)' : '⚠️  Not set (optional)'
    };
  }
  
  // Basic validation
  let valid = true;
  let message = '✅ Set';
  
  if (envVar.name === 'NODE_ENV' && value !== 'production' && value !== 'development') {
    valid = false;
    message = `⚠️  Invalid value: "${value}" (should be "production" or "development")`;
  }
  
  if (envVar.name === 'DATABASE_URL') {
    if (!value.startsWith('postgresql://') && !value.startsWith('postgres://')) {
      valid = false;
      message = '⚠️  Invalid format (should start with postgresql://)';
    } else {
      message = '✅ Set (format looks valid)';
    }
  }
  
  if (envVar.name === 'PORT') {
    const portNum = Number(value);
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      valid = false;
      message = `⚠️  Invalid port number: "${value}"`;
    } else {
      message = `✅ Set (port ${portNum})`;
    }
  }
  
  // Mask sensitive values in output
  if (value && (envVar.name.includes('KEY') || envVar.name.includes('SECRET') || envVar.name.includes('PASSWORD'))) {
    const masked = value.length > 8 
      ? `${value.substring(0, 4)}...${value.substring(value.length - 4)}`
      : '***';
    message += ` (value: ${masked})`;
  }
  
  return { present, valid, message };
}

function main() {
  console.log('🔍 Railway Environment Variables Check\n');
  console.log('='.repeat(70));
  console.log(`Environment: ${process.env.NODE_ENV || 'not set'}`);
  console.log(`Port: ${process.env.PORT || 'not set'}`);
  console.log('='.repeat(70));
  console.log('');

  const critical: EnvVar[] = [];
  const important: EnvVar[] = [];
  const optional: EnvVar[] = [];

  envVars.forEach(envVar => {
    if (envVar.category === 'critical') critical.push(envVar);
    else if (envVar.category === 'important') important.push(envVar);
    else optional.push(envVar);
  });

  let hasErrors = false;
  let hasWarnings = false;

  // Check Critical
  console.log('🔴 CRITICAL (Must Have):\n');
  critical.forEach(envVar => {
    const check = checkEnvVar(envVar);
    console.log(`${envVar.name.padEnd(30)} ${check.message}`);
    if (envVar.description) {
      console.log(`  ${' '.repeat(30)} ${envVar.description}`);
    }
    if (envVar.example) {
      console.log(`  ${' '.repeat(30)} Example: ${envVar.example}`);
    }
    console.log('');
    
    if (!check.valid || (envVar.required && !check.present)) {
      hasErrors = true;
    }
  });

  // Check Important
  console.log('🟡 IMPORTANT (Should Have):\n');
  important.forEach(envVar => {
    const check = checkEnvVar(envVar);
    console.log(`${envVar.name.padEnd(30)} ${check.message}`);
    if (envVar.description) {
      console.log(`  ${' '.repeat(30)} ${envVar.description}`);
    }
    if (envVar.example) {
      console.log(`  ${' '.repeat(30)} Example: ${envVar.example}`);
    }
    console.log('');
    
    if (!check.valid) {
      hasWarnings = true;
    }
  });

  // Check Optional
  console.log('🟢 OPTIONAL (Nice to Have):\n');
  optional.forEach(envVar => {
    const check = checkEnvVar(envVar);
    console.log(`${envVar.name.padEnd(30)} ${check.message}`);
    if (envVar.description) {
      console.log(`  ${' '.repeat(30)} ${envVar.description}`);
    }
    console.log('');
  });

  // Summary
  console.log('='.repeat(70));
  console.log('📊 SUMMARY');
  console.log('='.repeat(70));
  
  if (hasErrors) {
    console.log('❌ CRITICAL ERRORS FOUND');
    console.log('   Fix these issues before the server can start properly.');
    console.log('');
  } else if (hasWarnings) {
    console.log('⚠️  WARNINGS FOUND');
    console.log('   Server may start but some features may not work.');
    console.log('');
  } else {
    console.log('✅ All critical environment variables are configured correctly!');
    console.log('');
  }

  // Recommendations
  if (hasErrors) {
    console.log('💡 RECOMMENDATIONS:');
    console.log('');
    console.log('1. Go to Railway dashboard → Your Service → Variables');
    console.log('2. Add all missing CRITICAL environment variables');
    console.log('3. Verify values are correct (no extra spaces, correct format)');
    console.log('4. Restart the service after adding variables');
    console.log('5. Check deployment logs for any remaining errors');
    console.log('');
  }

  process.exit(hasErrors ? 1 : 0);
}

main();
