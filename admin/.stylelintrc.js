'use strict';

module.exports = {
  "extends": [
    "stylelint-config-standard-scss"
  ],
  // kept byte-identical to the wallet's copy (utils/printFont.spec.js)
  "ignoreFiles": ["src/assets/fonts/**"],
  "overrides": [
    {
      // CSS Modules: a class is read as `classes.someName`, so its name is camelCase, and
      // `:global(…)` reaches classes the module does not own (Bootstrap's, a library's), which
      // keep their kebab-case names.
      "files": ["**/*.module.css", "**/*.module.scss"],
      "rules": {
        "selector-class-pattern": "^([a-z][a-zA-Z0-9]*|[a-z][a-z0-9]*(-[a-z0-9]+)*)$",
        "selector-pseudo-class-no-unknown": [true, { "ignorePseudoClasses": ["global"] }]
      }
    }
  ]
};
