/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  verbose: true,
  preset: 'ts-jest',
  collectCoverage: false,
  collectCoverageFrom: ['src/**/*.ts', '!**/node_modules/**', '!src/seeds/**', '!build/**'],
  coverageThreshold: {
    global: {
      lines: 75,
    },
  },
  setupFiles: ['<rootDir>/test/testSetup.ts'],
  setupFilesAfterEnv: ['<rootDir>/test/extensions.ts'],
  modulePathIgnorePatterns: ['<rootDir>/build/'],
  moduleNameMapper: {
    '@/(.*)': '<rootDir>/src/$1',
    '@arg/(.*)': '<rootDir>/src/graphql/arg/$1',
    '@input/(.*)': '<rootDir>/src/graphql/input/$1',
    '@dltConnector/(.*)': '<rootDir>/src/apis/dltConnector/$1',
    '@enum/(.*)': '<rootDir>/src/graphql/enum/$1',
    '@model/(.*)': '<rootDir>/src/graphql/model/$1',
    '@union/(.*)': '<rootDir>/src/graphql/union/$1',
    '@repository/(.*)': '<rootDir>/src/typeorm/repository/$1',
    '@typeorm/(.*)': '<rootDir>/src/typeorm/$1',
    '@test/(.*)': '<rootDir>/test/$1',
    '@entity/(.*)':
      process.env.NODE_ENV === 'development'
        ? '<rootDir>/../database/entity/$1'
        : '<rootDir>/../database/build/entity/$1',
    '@logging/(.*)':
      process.env.NODE_ENV === 'development'
        ? '<rootDir>/../database/logging/$1'
        : '<rootDir>/../database/build/logging/$1',
    '@dbTools/(.*)':
      process.env.NODE_ENV === 'development'
        ? '<rootDir>/../database/src/$1'
        : '<rootDir>/../database/build/src/$1',
    '@config/(.*)':
      process.env.NODE_ENV === 'development'
        ? '<rootDir>/../config/src/$1'
        : '<rootDir>/../config/build/$1',
  },
}
