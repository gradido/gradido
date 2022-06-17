module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    jest: true,
  },
  parserOptions: {
    parser: 'babel-eslint',
  },
  extends: [
    'standard',
    'plugin:vue/essential',
    'plugin:prettier/recommended',
    'plugin:@intlify/vue-i18n/recommended',
  ],
  // required to lint *.vue files
  plugins: ['vue', 'prettier', 'jest'],
  overrides: [
    {
      files: ['*.json'],
      extends: ['plugin:@intlify/vue-i18n/recommended'],
      rules: {
        // TODO: enable
        '@intlify/vue-i18n/no-html-messages': 'off',
      },
    },
  ],
  // add your custom rules here
  rules: {
    'no-console': ['error'],
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'vue/component-name-in-template-casing': ['error', 'kebab-case'],
    'vue/no-static-inline-styles': [
      'error',
      {
        allowBinding: false,
      },
    ],
    '@intlify/vue-i18n/no-dynamic-keys': 'error',
    '@intlify/vue-i18n/no-unused-keys': [
      'error',
      {
        src: './src',
        extensions: ['.js', '.vue'],
        // TODO: remove ignores
        ignores: [
          '/form./',
          '/time./',
          '/decay.types./',
          'settings.password.resend_subtitle',
          'settings.password.reset',
          'settings.password.reset-password.text',
          'settings.password.set',
          'settings.password.set-password.text',
          'settings.password.subtitle',
        ],
        enableFix: false,
      },
    ],
    '@intlify/vue-i18n/no-missing-keys-in-other-locales': 'error',
    'prettier/prettier': [
      'error',
      {
        htmlWhitespaceSensitivity: 'ignore',
      },
    ],
  },
  settings: {
    'vue-i18n': {
      localeDir: './src/locales/*.json',
      // Specify the version of `vue-i18n` you are using.
      // If not specified, the message will be parsed twice.
      messageSyntaxVersion: '^8.22.4',
    },
  },
}
