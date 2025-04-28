/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
// eslint-disable-next-line import/no-commonjs, import/unambiguous
module.exports = {
  verbose: true,
  preset: 'ts-jest',
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.ts', '!**/node_modules/**', '!src/seeds/**', '!build/**'],
  coverageThreshold: {
    global: {
      lines: 82,
    },
  },
  setupFiles: ['<rootDir>/test/testSetup.ts'],
  setupFilesAfterEnv: [],
  modulePathIgnorePatterns: ['<rootDir>/build/'],
  moduleNameMapper: {
    '@/(.*)': '<rootDir>/src/$1',
    '@test/(.*)': '<rootDir>/test/$1',
  },
}
