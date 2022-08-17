module.exports = {
  verbose: true,
  collectCoverageFrom: [
    'src/**/*.{js,vue}',
    '!**/node_modules/**',
    '!src/assets/**',
    '!**/?(*.)+(spec|test).js?(x)',
  ],
  moduleFileExtensions: [
    'js',
    // 'jsx',
    'json',
    'vue',
  ],
  // coverageReporters: ['lcov', 'text'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less)$': 'identity-obj-proxy',
  },
  transform: {
    '^.+\\.vue$': 'vue-jest',
    '^.+\\.(js|jsx)?$': 'babel-jest',
    '<rootDir>/node_modules/vee-validate/dist/rules': 'babel-jest',
  },
  setupFiles: ['<rootDir>/test/testSetup.js', 'jest-canvas-mock'],
  testMatch: ['**/?(*.)+(spec|test).js?(x)'],
  // snapshotSerializers: ['jest-serializer-vue'],
  transformIgnorePatterns: ['<rootDir>/node_modules/(?!vee-validate/dist/rules)'],
  testEnvironment: 'jest-environment-jsdom-sixteen', // not needed anymore since jest@26, see: https://www.npmjs.com/package/jest-environment-jsdom-sixteen
}
