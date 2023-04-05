// eslint-disable-next-line import/no-commonjs, import/unambiguous
module.exports = {
  root: true,
  env: {
    node: true,
  },
  parser: '@typescript-eslint/parser',
  plugins: ['prettier', '@typescript-eslint', 'type-graphql', 'jest', 'import', 'n'],
  extends: [
    'standard',
    'eslint:recommended',
    'plugin:prettier/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
  ],
  settings: {
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
    'import/resolver': {
      typescript: {
        project: ['tsconfig.json', 'backend/tsconfig.json'],
      },
      node: {
        project: ['tsconfig.json', 'backend/tsconfig.json'],
      },
    },
  },
  rules: {
    'no-console': ['error'],
    'no-debugger': 'error',
    'prettier/prettier': [
      'error',
      {
        htmlWhitespaceSensitivity: 'ignore',
      },
    ],
    // jest
    'jest/no-disabled-tests': 'error',
    'jest/no-focused-tests': 'error',
    'jest/no-identical-title': 'error',
    'jest/prefer-to-have-length': 'error',
    'jest/valid-expect': 'error',
    // import
    'import/export': 'error',
    'import/no-deprecated': 'error',
    'import/no-empty-named-blocks': 'error',
    'import/no-extraneous-dependencies': 'error',
    'import/no-mutable-exports': 'error',
    'import/no-unused-modules': 'error',
    'import/no-named-as-default': 'error',
    'import/no-named-as-default-member': 'error',
    'import/no-amd': 'error',
    'import/no-commonjs': 'error',
    'import/no-import-module-exports': 'error',
    'import/no-nodejs-modules': 'off',
    'import/unambiguous': 'error',
    'import/default': 'error',
    'import/named': 'error',
    'import/namespace': 'error',
    'import/no-absolute-path': 'error',
    'import/no-cycle': 'off',
    'import/no-dynamic-require': 'error',
    'import/no-internal-modules': 'off',
    'import/no-relative-packages': 'error',
    'import/no-relative-parent-imports': ['error', { ignore: ['@/*'] }],
    'import/no-self-import': 'error',
    'import/no-unresolved': 'error',
    'import/no-useless-path-segments': 'error',
    'import/no-webpack-loader-syntax': 'error',
    'import/consistent-type-specifier-style': 'error',
    'import/exports-last': 'off',
    'import/extensions': 'error',
    'import/first': 'error',
    'import/group-exports': 'off',
    'import/newline-after-import': 'error',
    'import/no-anonymous-default-export': 'error',
    'import/no-default-export': 'off',
    'import/no-duplicates': 'error',
    'import/no-named-default': 'error',
    'import/no-namespace': 'error',
    'import/no-unassigned-import': 'error',
    'import/order': [
      'error',
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'object', 'type'],
        'newlines-between': 'always',
        pathGroups: [
          {
            pattern: '@?*/**',
            group: 'external',
            position: 'after',
          },
          {
            pattern: '@/**',
            group: 'external',
            position: 'after',
          },
        ],
        alphabetize: {
          order: 'asc' /* sort in ascending order. Options: ['ignore', 'asc', 'desc'] */,
          caseInsensitive: true /* ignore case. Options: [true, false] */,
        },
        distinctGroup: true,
      },
    ],
    'import/prefer-default-export': 'off', // TODO
    // n
    'n/handle-callback-err': 'error',
    'n/no-callback-literal': 'error',
    'n/no-exports-assign': 'error',
    'n/no-extraneous-import': 'error',
    'n/no-extraneous-require': 'error',
    'n/no-hide-core-modules': 'error',
    'n/no-missing-import': 'off', // not compatible with typescript
    'n/no-missing-require': 'error',
    'n/no-new-require': 'error',
    'n/no-path-concat': 'error',
    'n/no-process-exit': 'error',
    'n/no-unpublished-bin': 'error',
    'n/no-unpublished-import': 'off', // TODO need to exclude seeds
    'n/no-unpublished-require': 'error',
    'n/no-unsupported-features': ['error', { ignores: ['modules'] }],
    'n/no-unsupported-features/es-builtins': 'error',
    'n/no-unsupported-features/es-syntax': 'error',
    'n/no-unsupported-features/node-builtins': 'error',
    'n/process-exit-as-throw': 'error',
    'n/shebang': 'error',
    'n/callback-return': 'error',
    'n/exports-style': 'error',
    'n/file-extension-in-import': 'off',
    'n/global-require': 'error',
    'n/no-mixed-requires': 'error',
    'n/no-process-env': 'error',
    'n/no-restricted-import': 'error',
    'n/no-restricted-require': 'error',
    'n/no-sync': 'error',
    'n/prefer-global/buffer': 'error',
    'n/prefer-global/console': 'error',
    'n/prefer-global/process': 'error',
    'n/prefer-global/text-decoder': 'error',
    'n/prefer-global/text-encoder': 'error',
    'n/prefer-global/url': 'error',
    'n/prefer-global/url-search-params': 'error',
    'n/prefer-promises/dns': 'error',
    'n/prefer-promises/fs': 'error',
  },
  overrides: [
    // only for ts files
    {
      files: ['*.ts', '*.tsx'],
      extends: [
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
        'plugin:type-graphql/recommended',
      ],
      rules: {
        // allow explicitly defined dangling promises
        '@typescript-eslint/no-floating-promises': ['error', { ignoreVoid: true }],
        'no-void': ['error', { allowAsStatement: true }],
        // ignore prefer-regexp-exec rule to allow string.match(regex)
        '@typescript-eslint/prefer-regexp-exec': 'off',
        // this should not run on ts files: https://github.com/import-js/eslint-plugin-import/issues/2215#issuecomment-911245486
        'import/unambiguous': 'off',
      },
      parserOptions: {
        tsconfigRootDir: './',
        project: ['**/tsconfig.json'],
        // this is to properly reference the referenced project database without requirement of compiling it
        EXPERIMENTAL_useSourceOfProjectReferenceRedirect: true,
      },
    },
  ],
}
