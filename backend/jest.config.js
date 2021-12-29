/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  verbose: true,
  preset: 'ts-jest',
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.ts', '!**/node_modules/**'],
  moduleNameMapper: {
    '@entity/(.*)': '<rootDir>/../database/build/entity/$1',
    '@dbTools/(.*)': process.env.NODE_ENV === 'development' ? '<rootDir>/../database/src/$1' : '<rootDir>/../database/build/src/$1',
  },
}
