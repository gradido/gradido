import { afterAll, beforeEach, describe, expect, it, jest, mock } from 'bun:test'
import { AbstractLoggingView, AppDatabase, aliasExists } from 'database'
import { getLogger } from '../../../config-schema/test/testSetup.bun'
import { LOG4JS_BASE_CATEGORY_NAME } from '../config/const'
import { validateAlias } from './user'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.validation.user.validateAlias`)

mock.module('shared/src/schema/user.schema', () => ({
  aliasSchema: {
    parse: jest.fn(),
  },
}))

// bun mock module currently cannot be restored, so we must mock compatible with all tests!
mock.module('database', () => ({
  aliasExists: jest.fn(),
  AbstractLoggingView,
  AppDatabase,
}))

afterAll(() => {
  mock.restore()
})

describe('validate alias', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('the schema refuses the alias', () => {
    it('throws and logs an error', () => {
      // console.log(`validateAlias('Bi')=${JSON.stringify(validateAlias('Bi'))}`)
      expect(validateAlias('Bi')).rejects.toThrowError(new Error('Given alias is too short'))
      expect(logger.warn.mock.calls[0]).toEqual([
        'invalid alias',
        'Bi',
        expect.arrayContaining([
          expect.objectContaining({
            kind: 'validation',
            type: 'min_length',
            requirement: 3,
            message: 'Given alias is too short',
          }),
        ]),
      ])
    })
  })

  describe('test against existing alias in database', () => {
    describe('alias exists in database', () => {
      it('throws and logs an error', () => {
        ;(aliasExists as jest.Mock).mockReturnValue(true)
        expect(validateAlias('b-b')).rejects.toEqual(new Error('Given alias is already in use'))
        expect(logger.warn.mock.calls[0]).toEqual([
          'alias already in use: alias=b-b, userId=undefined',
        ])
      })
    })

    describe('valid alias', () => {
      it('resolves to true', async () => {
        ;(aliasExists as jest.Mock).mockReturnValue(false)
        expect(validateAlias('bibi')).resolves.toEqual(true)
      })
    })
  })
})
