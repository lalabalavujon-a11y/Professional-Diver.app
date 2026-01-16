// Minimal runner to execute generate-all-lessons.ts with ts-node in ESM mode.
import { register } from 'ts-node';
import { pathToFileURL } from 'node:url';

register({
  transpileOnly: true,
  compilerOptions: {
    module: 'esnext',
    moduleResolution: 'node',
    esModuleInterop: true,
    skipLibCheck: true,
    allowImportingTsExtensions: true,
    baseUrl: '.',
    paths: {
      '@shared/*': ['shared/*'],
    },
  },
});

await import(pathToFileURL('./scripts/generate-all-lessons.ts').href);
