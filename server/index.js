// Workaround entry point to bypass esbuild compatibility issues
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Register ts-node for ESM
try {
  await register('ts-node/esm', pathToFileURL('./'));
} catch (error) {
  console.error('Failed to register ts-node:', error);
  process.exit(1);
}

// Import and run the TypeScript server
import('./index.ts').catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});


