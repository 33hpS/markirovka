// Explicit lint-staged config to avoid picking up transitive package configs (e.g., node_modules/cac/package.json)
/** @type {import('lint-staged').Config} */
export default {
  '*.{js,jsx,ts,tsx}': [
    'eslint --fix',
    'prettier --write'
  ],
  '*.{json,css,md}': [
    'prettier --write'
  ]
};
