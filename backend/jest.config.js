const fs = require('node:fs')
const path = require('node:path')

// The tests come in two kinds, and `bun run test` runs them one after the other:
// - serial (`TEST_KIND=serial`): a file that sets up the test environment or empties the
//   database (`testEnvironment…()`, `cleanDB()` from test/helpers.ts) - they share one
//   database - or that says so itself with a line `// jest: serial`, with the reason behind
//   it (a test that measures wall-clock time, which files running beside it stretch).
// - parallel (`TEST_KIND=parallel`): everything else. No database and no Redis - and both
//   unreachable (see the `test:parallel` script), so that a test which reaches for one
//   after all fails loudly instead of racing the others.
// Which kind a file is, is read from the file itself: nothing to register, nothing to rename.
// Without TEST_KIND jest sees every test, as `test:coverage` and a run by hand need it.
const RUNS_SERIAL = /\b(testEnvironment\w*|cleanDB)\(|^\/\/ jest: serial\b/m

const testFilesIn = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      return testFilesIn(file)
    }
    return entry.name.endsWith('.test.ts') ? [file] : []
  })

const serialTests = ['src', 'test']
  .flatMap((dir) => testFilesIn(path.join(__dirname, dir)))
  .filter((file) => RUNS_SERIAL.test(fs.readFileSync(file, 'utf8')))

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const testsOfKind = {
  parallel: { testPathIgnorePatterns: ['/node_modules/', ...serialTests.map(escapeRegExp)] },
  serial: { testMatch: serialTests },
}

/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  verbose: true,
  preset: 'ts-jest',
  setupFiles: ['<rootDir>/test/testSetup.ts'],
  setupFilesAfterEnv: ['<rootDir>/test/testSetupAfterEnv.ts'],
  modulePathIgnorePatterns: ['<rootDir>/build/'],
  moduleNameMapper: {
    '@/(.*)': '<rootDir>/src/$1',
    '@arg/(.*)': '<rootDir>/src/graphql/arg/$1',
    '@input/(.*)': '<rootDir>/src/graphql/input/$1',
    '@dltConnector/(.*)': '<rootDir>/src/apis/dltConnector/$1',
    '@enum/(.*)': '<rootDir>/src/graphql/enum/$1',
    '@model/(.*)': '<rootDir>/src/graphql/model/$1',
    '@union/(.*)': '<rootDir>/src/graphql/union/$1',
    '@test/(.*)': '<rootDir>/test/$1',
  },
  transform: {
    '^.+\\.(t|j)sx?$': ['@swc/jest', {
      jsc: {
        parser: {
          syntax: 'typescript',
          decorators: true,
          tsc: true,
        },
        transform: {
          decoratorMetadata: true,
        },
      }
    }],
  },
  transformIgnorePatterns: ['/node_modules/(?!(drizzle-orm|valibot)/)'],
  collectCoverage: false,
  collectCoverageFrom: ['src/**/*.ts', '!**/node_modules/**', '!src/seeds/**', '!build/**'],
  coverageThreshold: {
    global: {
      lines: 75,
    },
  },
  ...testsOfKind[process.env.TEST_KIND],
}
