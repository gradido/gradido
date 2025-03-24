'use strict'

module.exports = {
  extends: ['stylelint-config-standard-scss', 'stylelint-config-recommended-vue'],
  overrides: [
    {
      files: '**/*.{scss}',
      customSyntax: 'postcss-scss',
      extends: ['stylelint-config-standard-scss'],
    },
    {
      files: '**/*.vue',
      customSyntax: 'postcss-html',
      extends: ['stylelint-config-recommended-vue'],
    },
  ],
  "rules": {
    "declaration-property-value-no-unknown": null
  }
}
