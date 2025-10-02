#!/usr/bin/env node
/**
 * Post-build script: Write version.json to dist/ for fallback version info
 * Usage: node scripts/write-version-json.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { resolve } from 'path';

try {
  // Read package version
  const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));
  const version = pkg.version || '1.0.0';

  // Get commit hash (short)
  let commit = 'dev';
  try {
    commit = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch (err) {
    console.warn('[write-version] No git or uncommitted, using fallback commit:', commit);
  }

  // Build timestamp
  const buildTime = new Date().toISOString();

  const versionInfo = {
    version,
    commit,
    buildTime,
    source: 'build-time'
  };

  const outputPath = resolve('./dist/version.json');
  writeFileSync(outputPath, JSON.stringify(versionInfo, null, 2) + '\n');
  
  console.log('[write-version] Created:', outputPath);
  console.log('[write-version] Content:', JSON.stringify(versionInfo, null, 2));
} catch (err) {
  console.error('[write-version] Error:', err);
  process.exit(1);
}