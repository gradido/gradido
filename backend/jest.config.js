/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  verbose: true,
  preset: 'ts-jest',
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.ts', '!**/node_modules/**'],
  moduleNameMapper: {
    '@entity/(.*)': '<rootDir>/../database/entity/$1',
    '@dbTools/(.*)': '<rootDir>/../database/src/$1',
    '@migrations/(.*)': '<rootDir>/../database/migrations/$1',
  },
}
