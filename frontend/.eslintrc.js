module.exports = {
  root: true,
  // The translations are checked in every kind of file: their keys exist, and none is left
  // unused. Style and Vue rules only for the old kinds (override below) -- Biome lints the
  // TypeScript.
  extends: ['plugin:@intlify/vue-i18n/recommended'],
  overrides: [
    {
      files: ['*.js', '*.vue', '*.json'],
      env: {
        browser: true,
        node: true,
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
      plugins: ['vue', 'prettier'],
      rules: {
        'no-console': ['error'],
        'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
        'no-useless-escape': 0,
        'no-unused-vars': 0, // TODO remove at the end of migration and fix
        'node/no-callback-literal': 0, // Necessary to run tests
        'vue/component-name-in-template-casing': ['error', 'kebab-case'],
        // 'vue/no-static-inline-styles': [
        //   'error',
        //   {
        //     allowBinding: false,
        //   },
        // ],
        'vue/multi-word-component-names': 0,
        'vue/no-v-html': 0,
        'vue/no-export-in-script-setup': 0, // TODO remove at the end of migration and fix
        'vue/prop-name-casing': 0, // TODO remove at the end of migration and fix
        'vue/require-explicit-emits': 0, // TODO remove at the end of migration and fix
        'vue/no-static-inline-styles': 0, // TODO remove at the end of migration and fix
        'vue/v-on-event-hyphenation': 0, // TODO remove at the end of migration and fix
        'vue/require-default-prop': 0, // TODO remove at the end of migration and fix
        'vue/no-computed-properties-in-data': 0, // TODO remove at the end of migration and fix
        'prettier/prettier': [
          'error',
          {
            htmlWhitespaceSensitivity: 'ignore',
          },
        ],
      },
    },
    {
      files: ['*.ts', '*.tsx'],
      parserOptions: {
        // vue-eslint-parser (from the i18n preset) hands everything that is no .vue to this one
        parser: '@typescript-eslint/parser',
      },
    },
    {
      files: ['*.json'],
      extends: ['plugin:@intlify/vue-i18n/recommended'],
      rules: {
        // TODO: enable
        '@intlify/vue-i18n/no-html-messages': 'off',
        '@intlify/vue-i18n/no-missing-keys': 'warn',
        '@intlify/vue-i18n/no-unused-keys': 'warn',
      },
    },
    {
      files: ['{de,en}.json'],
      rules: {
        '@intlify/vue-i18n/no-missing-keys': 'error',
        '@intlify/vue-i18n/no-unused-keys': 'error',
      },
    },
  ],
  // add your custom rules here
  rules: {
    '@intlify/vue-i18n/no-missing-keys': 'error',
    '@intlify/vue-i18n/no-unused-keys': [
      'error',
      {
        src: './src',
        extensions: ['.js', '.vue', '.ts', '.tsx'],
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
          'math.asterisk',
          '/pageTitle./',
          '/matching.type./',
          // built as `matching.map.look.${look}` / `.channels.${channel}`
          '/matching.map.look./',
          '/matching.map.channels./',
          // built as `matching.map.reach.${option}` over REACHES. Named one by one
          // rather than by prefix, so `reach.label` and `reach.fernHint` - which are
          // written out in the template - stay under the rule.
          'matching.map.reach.regional',
          'matching.map.reach.fern',
          // built as `thank-you-card.status.${status}` from the backend enum, so every
          // one of them is reached without ever appearing as a literal here
          '/thank-you-card.status./',
          // built as `matching.list.dir.${dir}` / `.line.${channel}`
          '/matching.list.dir./',
          '/matching.list.line./',
          // built as `scanner.foreign.${kind}` -- the three kinds of Gradido code the
          // scanner's foreign-community card can announce
          '/scanner.foreign./',
          // The first-creation catalog: every sentence stem, tick and category heading is
          // reached as `firstCreation.catalog.${key}` and friends, off the literal lists in
          // utils/firstCreationCatalog.js, so none of them appears here as a literal.
          // ⚠️ This rule is what would otherwise notice a key that no longer has a text.
          // `firstCreationLocales.spec.js` takes that job over for these four: it holds the
          // key lists against de and en and fails on either a missing text or a stray one.
          '/firstCreation.catalog./',
          '/firstCreation.checks./',
          '/firstCreation.checkHints./',
          '/firstCreation.categories./',
          'error.empty-transactionlist',
          'error.no-transactionlist',
          'error.session-renewal-failed',
        ],
        enableFix: false,
      },
    ],
    '@intlify/vue-i18n/no-missing-keys-in-other-locales': 'warn',
  },
  settings: {
    'vue-i18n': {
      localeDir: './src/locales/*.json',
      // Specify the version of `vue-i18n` you are using.
      // If not specified, the message will be parsed twice.
      messageSyntaxVersion: '^9.13.1',
    },
  },
}
