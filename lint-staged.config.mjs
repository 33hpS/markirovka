// Explicit lint-staged config to avoid picking up transitive package configs (e.g., node_modules/cac/package.json)
/** @type {import('lint-staged').Config} */
export default {
  // Use functions so each tool only receives the actual staged file paths and no accidental extra globs.
  '*.{js,jsx,ts,tsx}': (files) => {
    const filtered = files.filter(f => !f.includes('node_modules/'));
    if (filtered.length === 0) return [];
    return [
      `eslint --fix ${filtered.map(f => `'${f}'`).join(' ')}`,
      `prettier --write ${filtered.map(f => `'${f}'`).join(' ')}`
    ];
  },
  '*.{json,css,md}': (files) => {
    const filtered = files.filter(f => !f.includes('node_modules/'));
    if (filtered.length === 0) return [];
    return [
      `prettier --write ${filtered.map(f => `'${f}'`).join(' ')}`
    ];
  }
};
