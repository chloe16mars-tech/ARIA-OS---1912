// @ts-check
const eslint = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

module.exports = defineConfig([
  {
    ignores: [
      'dist/**',
      'android/**',
      'node_modules/**',
      'src/environments/environment.mobile.ts',
      'src/environments/environment.prod.ts',
    ],
  },
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'app', style: 'camelCase' },
      ],
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'app', style: 'kebab-case' },
      ],
      // Allow `catch (e)` and underscore-prefixed unused identifiers — both
      // are widely-used conventions across this codebase.
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^(_|e|err|error)$',
        },
      ],
      // Trivially inferable types are fine; readability beats strictness here.
      '@typescript-eslint/no-inferrable-types': 'off',
      // `output()` bindings already enforce app-specific naming; reusing a
      // standard DOM event name (close, click, …) is fine in this codebase.
      '@angular-eslint/no-output-native': 'warn',
      '@angular-eslint/no-empty-lifecycle-method': 'warn',
    },
  },
  {
    files: ['**/*.html'],
    extends: [
      angular.configs.templateRecommended,
      angular.configs.templateAccessibility,
    ],
    rules: {
      // Accessibility: surface as warnings so CI does not break on legacy
      // templates while regressions stay visible in PR review.
      '@angular-eslint/template/click-events-have-key-events': 'warn',
      '@angular-eslint/template/interactive-supports-focus': 'warn',
    },
  },
]);
