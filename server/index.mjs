import { register } from 'node:module';
import { pathToFileURL } from 'node:url';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Try to register tsx if available
try {
  await register('tsx/esm', pathToFileURL('./'));
} catch (e) {
  console.error('Failed to register tsx, trying alternative...');
}

// Import the main server file
import('./index.ts');
