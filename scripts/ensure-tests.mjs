#!/usr/bin/env node
import { existsSync, mkdirSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const debug = process.env.DEBUG_ENSURE_TESTS === '1';
const log = (...args) => { if (debug) console.log('[ensure-tests:debug]', ...args); };

console.log('[ensure-tests] ESM version loaded. Node:', process.version);

const ROOTS = ['src'];
const TEST_FILE_RE = /\.test\.[jt]sx?$/;
const TEST_DIR_RE = /__tests__/i;

function scan(dir) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    log('skip dir', dir, e.message);
    return false;
  }
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (TEST_DIR_RE.test(entry.name)) return true;
      if (scan(full)) return true;
    } else if (TEST_FILE_RE.test(entry.name)) {
      return true;
    }
  }
  return false;
}

function hasAnyTests() {
  return ROOTS.some(r => existsSync(r) && scan(r));
}

if (hasAnyTests()) {
  console.log('[ensure-tests] At least one test file present.');
  process.exit(0);
}

const testDir = join('src', '__tests__');
if (!existsSync(testDir)) {
  mkdirSync(testDir, { recursive: true });
  log('created dir', testDir);
}
const smokePath = join(testDir, 'smoke.test.tsx');
if (!existsSync(smokePath)) {
  const content = `import { describe, it, expect } from 'vitest';\nimport { render } from '@testing-library/react';\nimport App from '../App';\n\ndescribe('App smoke test', () => {\n  it('renders without crashing', () => {\n    render(<App />);\n    expect(document.body.innerHTML.length).toBeGreaterThan(0);\n  });\n});\n`;
  writeFileSync(smokePath, content);
  console.log('[ensure-tests] Created smoke test at', smokePath);
} else {
  console.log('[ensure-tests] Smoke test already exists.');
}
