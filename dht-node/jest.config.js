/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  verbose: true,
  preset: 'ts-jest',
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.ts', '!**/node_modules/**', '!src/seeds/**', '!build/**'],
  setupFiles: ['<rootDir>/test/testSetup.ts'],
  setupFilesAfterEnv: [],
  modulePathIgnorePatterns: ['<rootDir>/build/'],
  moduleNameMapper: {
    '@/(.*)': '<rootDir>/src/$1',
    '@test/(.*)': '<rootDir>/test/$1',
    '@entity/(.*)':
      process.env.NODE_ENV === 'development'
        ? '<rootDir>/../database/entity/$1'
        : '<rootDir>/../database/build/entity/$1',
    '@dbTools/(.*)':
      process.env.NODE_ENV === 'development'
        ? '<rootDir>/../database/src/$1'
        : '<rootDir>/../database/build/src/$1',
  },
}
