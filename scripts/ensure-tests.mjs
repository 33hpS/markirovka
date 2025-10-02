#!/usr/bin/env node
import { existsSync, mkdirSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

// Debug marker to ensure latest script executes in Husky pre-push
console.log('[ensure-tests] ESM version loaded. Node:', process.version);

const testGlobs = [
  #!/usr/bin/env node
  import { existsSync, mkdirSync, writeFileSync, readdirSync } from 'node:fs';
  import { join } from 'node:path';

  const debug = process.env.DEBUG_ENSURE_TESTS === '1';
  function dlog(...args) { if (debug) console.log('[ensure-tests:debug]', ...args); }

  console.log('[ensure-tests] ESM version loaded. Node:', process.version);

  const testGlobs = ['src'];

  function findAnyTest() {
    const patterns = [/\.test\.[jt]sx?$/, /__tests__/i];

    function scan(dir) {
      let entries;
      try {
        entries = readdirSync(dir, { withFileTypes: true });
      } catch (e) {
        dlog('Cannot read directory', dir, e.message);
        return false;
      }
      #!/usr/bin/env node
      import { existsSync, mkdirSync, writeFileSync, readdirSync } from 'node:fs';
      import { join } from 'node:path';

      const debug = process.env.DEBUG_ENSURE_TESTS === '1';
      function dlog(...args) { if (debug) console.log('[ensure-tests:debug]', ...args); }

      console.log('[ensure-tests] ESM version loaded. Node:', process.version);

      const testGlobs = ['src'];

      function findAnyTest() {
        const patterns = [/\.test\.[jt]sx?$/, /__tests__/i];

        function scan(dir) {
          let entries;
          try {
            entries = readdirSync(dir, { withFileTypes: true });
          } catch (e) {
            dlog('Cannot read directory', dir, e.message);
            return false;
          }
          for (const e of entries) {
            if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
            const full = join(dir, e.name);
            if (e.isDirectory()) {
              if (patterns[1].test(e.name)) return true;
              if (scan(full)) return true;
            } else if (patterns[0].test(e.name)) {
              return true;
            }
          }
          return false;
        }

        for (const base of testGlobs) {
          if (existsSync(base) && scan(base)) return true;
        }
        return false;
      }

      if (findAnyTest()) {
        console.log('[ensure-tests] At least one test file present.');
        process.exit(0);
      }

      const testDir = join('src', '__tests__');
      if (!existsSync(testDir)) {
        mkdirSync(testDir, { recursive: true });
        dlog('Created test directory', testDir);
      }
      const smokePath = join(testDir, 'smoke.test.tsx');
      if (!existsSync(smokePath)) {
        const content = `import { describe, it, expect } from 'vitest';\nimport { render } from '@testing-library/react';\nimport App from '../App';\n\ndescribe('App smoke test', () => {\n  it('renders without crashing', () => {\n    render(<App />);\n    expect(document.body.innerHTML.length).toBeGreaterThan(0);\n  });\n});\n`;
        writeFileSync(smokePath, content);
        console.log('[ensure-tests] Created smoke test at', smokePath);
      } else {
        console.log('[ensure-tests] Smoke test already exists.');
      }
