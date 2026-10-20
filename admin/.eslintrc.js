// ESLint is only here for what Biome cannot do: check the translations. The locale files are
// checked against each other, and the code against them -- that every key it asks for exists,
// and that it asks for none it builds at runtime, which no check could follow.
module.exports = {
  root: true,
  extends: ['plugin:@intlify/vue-i18n/recommended'],
  overrides: [
    {
      files: ['*.ts', '*.tsx', '*.js'],
      parserOptions: {
        // vue-eslint-parser (from the plugin) hands everything that is no .vue to this one
        parser: '@typescript-eslint/parser',
      },
    },
  ],
  rules: {
    '@intlify/vue-i18n/no-dynamic-keys': 'error',
    '@intlify/vue-i18n/no-raw-text': 0, // TODO remove at the end of migration and fix
    '@intlify/vue-i18n/no-unused-keys': 0, // TODO remove at the end of migration and fix
    '@intlify/vue-i18n/no-missing-keys-in-other-locales': 'error',
  },
  settings: {
    'vue-i18n': {
      localeDir: './src/locales/*.json',
      // Specify the version of `vue-i18n` you are using.
      // If not specified, the message will be parsed twice.
      messageSyntaxVersion: '^8.26.5',
    },
  },
}
