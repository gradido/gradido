module.exports = {
  verbose: true,
  collectCoverageFrom: ['**/*.{js,vue}', '!**/node_modules/**', '!**/?(*.)+(spec|test).js?(x)'],
  moduleFileExtensions: [
    'js',
    //'jsx',
    'json',
    'vue',
  ],
  coverageReporters: ['lcov'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less)$': 'identity-obj-proxy',
  },
  transform: {
    '^.+\\.vue$': '<rootDir>/node_modules/vue-jest',
    '^.+\\.(js|jsx)?$': '<rootDir>/node_modules/babel-jest',
  },
  setupFiles: ['<rootDir>/test/testSetup.js'],
  testMatch: ['**/?(*.)+(spec|test).js?(x)'],
  // snapshotSerializers: ['jest-serializer-vue'],
  transformIgnorePatterns: ['<rootDir>/node_modules/'],
  preset: '@vue/cli-plugin-unit-jest',
}
