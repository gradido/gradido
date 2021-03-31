module.exports = {
  verbose: true,
  //collectCoverageFrom: ['**/*.{js,vue}', '!**/node_modules/**', '!**/?(*.)+(spec|test).js?(x)'],
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
    '^.+\\.vue$': 'vue-jest',
    '^.+\\.(js|jsx)?$': 'babel-jest',
    '<rootDir>/node_modules/vee-validate/dist/rules': 'babel-jest',
  },
  setupFiles: ['<rootDir>/test/testSetup.js'],
  testMatch: ['**/?(*.)+(spec|test).js?(x)'],
  // snapshotSerializers: ['jest-serializer-vue'],
  transformIgnorePatterns: [
    //    '<rootDir>/node_modules/',
    //    '<rootDir>/node_modules/(?!vee-validate/dist/rules)',
  ],
  //  preset: '@vue/cli-plugin-unit-jest',
}
