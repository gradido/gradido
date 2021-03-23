module.exports = {
    verbose: true,
    collectCoverageFrom: [
      "**/*.{js,vue}",
      "!**/node_modules/**",
      "!**/?(*.)+(spec|test).js?(x)"
    ],
    moduleFileExtensions: [
      'js',
      //'jsx',
      'json',
      'vue',
    ],
    coverageReporters: [
      "lcov"
    ],
    moduleNameMapper: {
      '^@/(.*)$': '<rootDir>/src/$1'
    },
    transform: {
      '^.+\\.vue$': 'vue-jest',
      // '.+\\.(css|styl|less|sass|scss|png|jpg|ttf|woff|woff2)$': 'jest-transform-stub',
      "^.+\\.(js|jsx)?$": "babel-jest"
    },
    //setupFiles: [
    //  "<rootDir>/test/registerContext.js"
    //],
    testMatch: [
      "**/?(*.)+(spec|test).js?(x)"
    ],
    // snapshotSerializers: ['jest-serializer-vue'],
    transformIgnorePatterns: ['<rootDir>/node_modules/']
  };
  