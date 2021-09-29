/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  verbose: true,
  preset: 'ts-jest',
  collectCoverageFrom: ['src/**/*.ts', '!**/node_modules/**', '!**/?(*.)+test.ts'],
}
