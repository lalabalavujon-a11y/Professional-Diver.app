require('ts-node/register/transpile-only');

// Ensure path aliases work in tsconfig-paths if configured; fallback to manual baseUrl/paths not applied here.

require('./generate-all-lessons.ts');
