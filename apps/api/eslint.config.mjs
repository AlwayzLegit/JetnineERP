import config from '@jetnine/config/eslint.node.js';

export default [
  ...config,
  {
    rules: {
      // NestJS uses parameter decorators heavily — turn off the unused-vars
      // rule for decorated params and rely on the TS compiler to catch dead code.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // NestJS classes commonly use empty constructors / interfaces.
      '@typescript-eslint/no-empty-object-type': 'off',
      // NestJS DI relies on runtime class identifiers as injection tokens, so
      // `consistent-type-imports` produces false positives for injected services.
      '@typescript-eslint/consistent-type-imports': 'off',
    },
  },
];
