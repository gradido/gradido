module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    jest: true,
    'vue/setup-compiler-macros': true,
  },
  parserOptions: {
    ecmaVersion: 2020,
  },
  extends: [
    'standard',
    'plugin:vue/vue3-recommended',
    'plugin:prettier/recommended',
    'plugin:@intlify/vue-i18n/recommended',
    'prettier',
  ],
  // required to lint *.vue files
  plugins: ['vue', 'prettier', 'jest'],
  overrides: [
    {
      files: ['*.json'],
      extends: ['plugin:@intlify/vue-i18n/recommended'],
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
    'vue/multi-word-component-names': 0,
    'vue/no-v-html': 0,
    '@intlify/vue-i18n/no-dynamic-keys': 'error',
    '@intlify/vue-i18n/no-unused-keys': [
      'error',
      {
        src: './src',
        extensions: ['.js', '.vue'],
        ignores: ['/overlay/'],
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
      messageSyntaxVersion: '^8.26.5',
    },
  },
}
