#!/usr/bin/env node
/**
 * Deploy script with dynamic env vars: npm run deploy:worker
 * Usage: node scripts/deploy-worker.mjs
 */

import { readFileSync } from 'fs';
import { execSync } from 'child_process';

try {
  // Read package version
  const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));
  const version = pkg.version || '1.0.0';

  // Get current commit (short)
  let commit = 'dev';
  try {
    commit = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch (err) {
    console.warn('[deploy] No git or uncommitted, using fallback commit:', commit);
  }

  console.log('[deploy] Deploying with metadata:', { version, commit });

  // Deploy with env vars
  const deployCmd = `npx wrangler deploy --var COMMIT_SHA=${commit} --var PKG_VERSION=${version}`;
  console.log('[deploy] Running:', deployCmd);
  
  execSync(deployCmd, { stdio: 'inherit' });
  
  console.log('[deploy] ✅ Deploy completed with version metadata');
} catch (err) {
  console.error('[deploy] ❌ Deploy failed:', err.message);
  process.exit(1);
}