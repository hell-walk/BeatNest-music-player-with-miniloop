import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';

const hooksRecommended =
  reactHooks.configs?.flat?.recommended ??
  reactHooks.configs?.['recommended-latest'] ??
  reactHooks.configs.recommended;

export default [
  { ignores: ['dist', 'node_modules'] },
  js.configs.recommended,
  hooksRecommended,
  reactRefresh.configs.vite,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_' }],
      // Context files export the provider component together with its hook –
      // a deliberate, common pattern; Fast Refresh still works for the component.
      'react-refresh/only-export-components': [
        'warn',
        {
          allowConstantExport: true,
          allowExportNames: ['useAuth', 'useConfig', 'useConsent', 'usePlayer', 'usePlayerTime', 'useTheme', 'THEMES', 'describedBy'],
        },
      ],
    },
  },
  {
    // Build-tool config files run in Node, not the browser.
    files: ['vite.config.js', 'eslint.config.js'],
    languageOptions: { globals: globals.node },
  },
];
