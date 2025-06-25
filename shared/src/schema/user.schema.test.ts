import { aliasSchema } from './user.schema'
import { describe, it, expect, beforeEach, mock, jest } from 'bun:test'


mock.module('database', () => ({
  aliasExists: jest.fn(),
}))

describe('validate alias', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('alias contains invalid characters', () => {
    it('throws and logs an error', () => {
      expect(() => aliasSchema.parse('Bibi.Bloxberg')).toThrowError(expect.objectContaining(
        expect.arrayContaining([
          expect.objectContaining({
            origin: 'string',
            code: 'invalid_format',
            format: 'regex',
            message: 'Invalid characters in alias',
            path: [],
          })
        ])
      ))
    })
  })

  describe('alias is a reserved word', () => {
    it('throws and logs an error', () => {
      expect(() => aliasSchema.parse('admin')).toThrowError(expect.objectContaining(
        expect.arrayContaining([
          expect.objectContaining({
            code: 'custom',
            message: 'Given alias is not allowed',
            path: [],
          }),
        ]),
      ))
    })
  })

  describe('alias length', () => {
    it('2 characters is not ok', () => {
      expect(() => aliasSchema.parse('Bi')).toThrowError()
    })
    it('3 characters is ok', () => {
      expect(() => aliasSchema.parse('Bib')).not.toThrowError()
    })
    it('20 characters is ok', () => {
      expect(() => aliasSchema.parse('BibiBloxbergMondLich')).not.toThrowError()
    })
    it('21 characters is not ok', () => {
      expect(() => aliasSchema.parse('BibiBloxbergZauberwald')).toThrowError()
    })
  })

  describe('alias is a reserved word with uppercase characters', () => {
    it('throws and logs an error', () => {
      expect(() => aliasSchema.parse('Admin')).toThrowError(expect.objectContaining(
        expect.arrayContaining([
          expect.objectContaining({
            code: 'custom',
            message: 'Given alias is not allowed',
            path: [],
          }),
        ]),
      ))
    })
  })

  describe('hyphens and underscore', () => {
    describe('alias starts with underscore', () => {
      it('throws and logs an error', () => {
        expect(() => aliasSchema.parse('_bibi')).toThrowError(expect.objectContaining(
          expect.arrayContaining([
            expect.objectContaining({
              origin: 'string',
              code: 'invalid_format',
              format: 'regex',
              message: 'Invalid characters in alias',
              path: [],
            })
          ])
        ))
      })
    })

    describe('alias contains two following hyphens', () => {
      it('throws and logs an error', () => {
        expect(() => aliasSchema.parse('bi--bi')).toThrowError(expect.objectContaining(
          expect.arrayContaining([
            expect.objectContaining({
              origin: 'string',
              code: 'invalid_format',
              format: 'regex',
              message: 'Invalid characters in alias',
              path: [],
            })
          ])
        ))
      })
    })
  })
})
