/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  verbose: true,
  preset: 'ts-jest',
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.ts', '!**/node_modules/**'],
  moduleNameMapper: {
    '@entity/(.*)': '<rootDir>/../database/build/entity/$1',
    '@dbTools/(.*)': '<rootDir>/../database/build/src/$1',
  },
}
