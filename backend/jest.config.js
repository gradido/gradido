/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  verbose: true,
  preset: 'ts-jest',
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.ts', '!**/node_modules/**'],
  setupFiles: ['<rootDir>/test/testSetup.ts'],
  moduleNameMapper: {
    '@/(.*)': '<rootDir>/src/$1',
    '@model/(.*)': '<rootDir>/src/graphql/model/$1',
    '@arg/(.*)': '<rootDir>/src/graphql/arg/$1',
    '@enum/(.*)': '<rootDir>/src/graphql/enum/$1',
    '@repository/(.*)': '<rootDir>/src/typeorm/repository/$1',
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
