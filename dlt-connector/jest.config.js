/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  verbose: true,
  preset: 'ts-jest',
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.ts', '!**/node_modules/**', '!src/seeds/**', '!build/**'],
  coverageThreshold: {
    global: {
      lines: 62,
    },
  },
  setupFiles: ['<rootDir>/test/testSetup.ts'],
  setupFilesAfterEnv: [],
  modulePathIgnorePatterns: ['<rootDir>/build/'],
  moduleNameMapper: {
    '@/(.*)': '<rootDir>/src/$1',
    '@resolver/(.*)': '<rootDir>/src/graphql/resolver/$1',
    '@input/(.*)': '<rootDir>/src/graphql/input/$1',
    '@proto/(.*)': '<rootDir>/src/proto/$1',
    '@test/(.*)': '<rootDir>/test/$1',
    '@client/(.*)': '<rootDir>/src/client/$1',
    '@entity/(.*)':
      // eslint-disable-next-line n/no-process-env
      process.env.NODE_ENV === 'development'
        ? '<rootDir>/../database/entity/$1'
        : '<rootDir>/../database/build/entity/$1',
    '@dbTools/(.*)':
      // eslint-disable-next-line n/no-process-env
      process.env.NODE_ENV === 'development'
        ? '<rootDir>/../database/src/$1'
        : '<rootDir>/../database/build/src/$1',
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
