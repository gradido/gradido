import { validateAlias } from './user.schema'
import { getLogger } from '../../../config-schema/test/testSetup.bun'
import { LOG_CATEGORY_SCHEMA_ALIAS } from '.'
import { describe, it, expect, beforeEach, mock, jest } from 'bun:test'
import { aliasExists } from 'database'

const logger = getLogger(`${LOG_CATEGORY_SCHEMA_ALIAS}.alias`)

mock.module('database', () => ({
  aliasExists: jest.fn(),
}))

describe('validate alias', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('alias too short', () => {
    it('throws and logs an error', () => {
      expect(validateAlias('Bi')).rejects.toThrowError(new Error('Given alias is too short'))
      expect(logger.warn.mock.calls[0]).toEqual([
        'invalid alias',
        'Bi',
        expect.arrayContaining([
          expect.objectContaining({
            code: 'too_small',
            minimum: 3,
            type: 'string',
            inclusive: true,
            exact: false,
            message: 'Given alias is too short',
            path: [],
          }),
        ]),
      ])
    })
  })

  describe('alias too long', () => {
    it('throws and logs an error', () => {
      expect(validateAlias('BibiBloxbergHexHexHex')).rejects.toThrowError(
        new Error('Given alias is too long'),
      )
      expect(logger.warn.mock.calls[0]).toEqual([
        'invalid alias',
        'BibiBloxbergHexHexHex',
        expect.arrayContaining([
          expect.objectContaining({
            code: 'too_big',
            maximum: 20,
            type: 'string',
            inclusive: true,
            exact: false,
            message: 'Given alias is too long',
            path: [],
          }),
        ]),
      ])
    })
  })

  describe('alias contains invalid characters', () => {
    it('throws and logs an error', () => {
      expect(validateAlias('Bibi.Bloxberg')).rejects.toEqual(
        new Error('Invalid characters in alias'),
      )
      expect(logger.warn.mock.calls[0]).toEqual([
        'invalid alias',
        'Bibi.Bloxberg',
        expect.arrayContaining([
          expect.objectContaining({
            validation: 'regex',
            code: 'invalid_string',
            message: 'Invalid characters in alias',
            path: [],
          }),
        ]),
      ])
    })
  })

  describe('alias is a reserved word', () => {
    it('throws and logs an error', () => {
      expect(validateAlias('admin')).rejects.toEqual(new Error('Given alias is not allowed'))
      expect(logger.warn.mock.calls[0]).toEqual([
        'invalid alias',
        'admin',
        expect.arrayContaining([
          expect.objectContaining({
            code: 'custom',
            message: 'Given alias is not allowed',
            path: [],
          }),
        ]),
      ])
    })
  })

  describe('alias is a reserved word with uppercase characters', () => {
    it('throws and logs an error', () => {
      expect(validateAlias('Admin')).rejects.toEqual(new Error('Given alias is not allowed'))
      expect(logger.warn.mock.calls[0]).toEqual([
        'invalid alias',
        'Admin',
        expect.arrayContaining([
          expect.objectContaining({
            code: 'custom',
            message: 'Given alias is not allowed',
            path: [],
          }),
        ]),
      ])
    })
  })

  describe('hyphens and underscore', () => {
    describe('alias starts with underscore', () => {
      it('throws and logs an error', () => {
        expect(validateAlias('_bibi')).rejects.toEqual(
          new Error('Invalid characters in alias'),
        )
        expect(logger.warn.mock.calls[0]).toEqual([
          'invalid alias',
          '_bibi',
          expect.arrayContaining([
            expect.objectContaining({
              validation: 'regex',
              code: 'invalid_string',
              message: 'Invalid characters in alias',
              path: [],
            }),
          ]),
        ])
      })
    })

    describe('alias contains two following hyphens', () => {
      it('throws and logs an error', () => {
        expect(validateAlias('bi--bi')).rejects.toEqual(
          new Error('Invalid characters in alias'),
        )
        expect(logger.warn.mock.calls[0]).toEqual([
          'invalid alias',
          'bi--bi',
          expect.arrayContaining([
            expect.objectContaining({
              validation: 'regex',
              code: 'invalid_string',
              message: 'Invalid characters in alias',
              path: [],
            }),
          ]),
        ])
      })
    })
  })
// TODO: add integration test with real database to test the query, maybe move query 
  describe('test against existing alias in database', () => {
    describe('alias exists in database', () => {
      it('throws and logs an error', () => {
        (aliasExists as jest.Mock).mockResolvedValue(true)
        expect(validateAlias('b-b')).rejects.toEqual(new Error('Given alias is already in use'))
        expect(logger.warn.mock.calls[0]).toEqual(['alias already in use', 'b-b'])
      })
    })

/*    describe('alias exists in database with in lower-case', () => {
      it('throws and logs an error', () => {
        expect(validateAlias('b-B')).rejects.toEqual(new Error('Given alias is already in use'))
        expect(logger.warn.mock.calls[0]).toEqual(['alias already in use', 'b-B'])
      })
    })
*/
    describe('valid alias', () => {
      it('resolves to true', async () => {
        (aliasExists as jest.Mock).mockResolvedValue(false)
        expect(validateAlias('bibi')).resolves.toEqual(true)
      })
    })
  })
})
