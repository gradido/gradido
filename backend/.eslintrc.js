module.exports = {
  root: true,
  env: {
    node: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 6,
    project: ['tsconfig.json'],
    sourceType: 'module'
  },
  plugins: ['prettier', '@typescript-eslint', 'type-graphql' ],
  extends: [
    'standard',
    'eslint:recommended',
    'plugin:prettier/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:type-graphql/recommended',
  ],
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
  },
}
