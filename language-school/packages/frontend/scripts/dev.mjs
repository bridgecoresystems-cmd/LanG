#!/usr/bin/env node
/**
 * Runs Nuxt dev with Node.js (required: Vite 7 needs Node 20.19+ or 22.12+)
 * Use: node scripts/dev.mjs
 */
import { spawn } from 'child_process';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));

const nuxtPkg = require.resolve('nuxt/package.json');
const nuxtDir = dirname(nuxtPkg);
const nuxtBin = join(nuxtDir, 'bin/nuxt.mjs');

const proc = spawn(process.execPath, ['--max-old-space-size=4096', nuxtBin, 'dev'], {
  stdio: 'inherit',
  cwd: join(__dirname, '..'),
  env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=4096' },
});
proc.on('exit', (code) => process.exit(code ?? 0));
