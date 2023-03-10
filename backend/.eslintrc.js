module.exports = {
  root: true,
  env: {
    node: true,
  },
  parser: '@typescript-eslint/parser',
  plugins: ['prettier', '@typescript-eslint', 'type-graphql', 'jest'],
  extends: ['standard', 'eslint:recommended', 'plugin:prettier/recommended'],
  // add your custom rules here
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
    'jest/no-disabled-tests': 'off', // TODO
    'jest/no-focused-tests': 'error',
    'jest/no-identical-title': 'error',
    'jest/prefer-to-have-length': 'warn',
    'jest/valid-expect': 'error',
  },
  overrides: [
    // only for ts files
    {
      files: ['*.ts'],
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
      },
      parserOptions: {
        tsconfigRootDir: __dirname,
        project: ['./tsconfig.json'],
        // this is to properly reference the referenced project database without requirement of compiling it
        EXPERIMENTAL_useSourceOfProjectReferenceRedirect: true,
      },
    },
  ],
}
