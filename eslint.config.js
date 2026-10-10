const js = require('@eslint/js');
const stylistic = require('@stylistic/eslint-plugin');
const html = require('eslint-plugin-html');
const globals = require('globals');

module.exports = [
  js.configs.recommended,
  stylistic.configs.customize({ semi: true, braceStyle: '1tbs', arrowParens: true }),
  {
    rules: {
      '@stylistic/max-len': ['error', { code: 120, tabWidth: 2, ignoreUrls: true }],
      '@stylistic/operator-linebreak': ['error', 'after', { overrides: { '?': 'before', ':': 'before' } }],
    },
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: globals.node,
    },
  },
  {
    files: ['test/**/*.js'],
    languageOptions: {
      globals: globals.mocha,
    },
  },
  // Editor scripts, loaded into the same browser page as resources/logger.js and resources/chrono.js
  {
    files: ['nodes/*.html'],
    plugins: { html },
    languageOptions: {
      sourceType: 'script',
      globals: {
        ...globals.browser,
        ...globals.jquery,
        RED: 'readonly',
        logger: 'readonly',
        chrono: 'readonly',
      },
    },
  },
];
