import { validateAlias } from './user.schema'
import { getLogger } from '../../../config-schema/test/testSetup.bun'
import { LOG_CATEGORY_SCHEMA_ALIAS } from '.'
import { describe, it, expect, beforeEach, mock, jest } from 'bun:test'
import { aliasExists } from 'database'

const logger = getLogger(`${LOG_CATEGORY_SCHEMA_ALIAS}.alias`)

mock.module('database', () => ({
  aliasExists: jest.fn(),
}))
mock.module('shared/src/schema/user.schema', () => ({
  aliasSchema: {
    parse: jest.fn(),
  },
}))

describe('validate alias', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('zod throw an validation error', () => {
    it('throws and logs an error', () => {
      expect(validateAlias('Bi')).rejects.toThrowError(new Error('Given alias is too short'))
      expect(logger.warn.mock.calls[0]).toEqual([
        'invalid alias',
        'Bi',
        expect.arrayContaining([
          // error vor zod v4
          /*expect.objectContaining({
            code: 'too_small',
            minimum: 3,
            origin: 'string',
            message: 'Given alias is too short',
          }),*/ 
          expect.objectContaining({
            code: 'too_small',
            exact: false,
            inclusive: true,
            minimum: 3,
            type: 'string',
            message: 'Given alias is too short',
            path: [],
          }),
        ]),
      ])
    })
  })

  
  describe('test against existing alias in database', () => {
    describe('alias exists in database', () => {
      it('throws and logs an error', () => {
        (aliasExists as jest.Mock).mockResolvedValue(true)
        expect(validateAlias('b-b')).rejects.toEqual(new Error('Given alias is already in use'))
        expect(logger.warn.mock.calls[0]).toEqual(['alias already in use', 'b-b'])
      })
    })

    describe('valid alias', () => {
      it('resolves to true', async () => {
        (aliasExists as jest.Mock).mockResolvedValue(false)
        expect(validateAlias('bibi')).resolves.toEqual(true)
      })
    })
  })
})
