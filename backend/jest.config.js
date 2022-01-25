/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = async () => {
  process.env.TZ = 'UTC'
  return {
    verbose: true,
    preset: 'ts-jest',
    collectCoverage: true,
    collectCoverageFrom: ['src/**/*.ts', '!**/node_modules/**'],
    moduleNameMapper: {
      '@entity/(.*)': '<rootDir>/../database/build/entity/$1',
      // This is hack to fix a problem with the library `ts-mysql-migrate` which does differentiate between its ts/js state
      '@dbTools/(.*)': '<rootDir>/../database/src/$1',
      /*
      '@dbTools/(.*)':
        process.env.NODE_ENV === 'development'
          ? '<rootDir>/../database/src/$1'
          : '<rootDir>/../database/build/src/$1',
      */
    },
  }
}
