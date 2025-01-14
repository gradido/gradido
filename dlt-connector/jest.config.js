/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  verbose: true,
  preset: 'ts-jest',
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.ts', '!**/node_modules/**', '!src/seeds/**', '!build/**'],
  coverageThreshold: {
    global: {
      lines: 72,
    },
  },
  setupFiles: ['<rootDir>/test/testSetup.ts'],
  setupFilesAfterEnv: [],
  modulePathIgnorePatterns: ['<rootDir>/build/'],
  moduleNameMapper: {
    '@/(.*)': '<rootDir>/src/$1',
    '@arg/(.*)': '<rootDir>/src/graphql/arg/$1',
    '@controller/(.*)': '<rootDir>/src/controller/$1',
    '@enum/(.*)': '<rootDir>/src/graphql/enum/$1',
    '@model/(.*)': '<rootDir>/src/graphql/model/$1',
    '@resolver/(.*)': '<rootDir>/src/graphql/resolver/$1',
    '@input/(.*)': '<rootDir>/src/graphql/input/$1',
    '@proto/(.*)': '<rootDir>/src/proto/$1',
    '@test/(.*)': '<rootDir>/test/$1',
    '@client/(.*)': '<rootDir>/src/client/$1',
    '@validator/(.*)': '<rootDir>/src/graphql/validator/$1',
  },
}
/*
@arg/*": ["src/graphql/arg/*"],
      "@enum/*": ["src/graphql/enum/*"],
      "@input/*": ["src/graphql/input/*"],
      "@resolver/*": ["src/graphql/resolver/*"],
      "@scalar/*": ["src/graphql/scalar/*"],
      "@test/*": ["test/*"],
      "@proto/*" : ["src/proto/*"],
      */
