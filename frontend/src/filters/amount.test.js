import { describe, it, expect, vi } from 'vitest'
import { createFilters } from './amount'

const i18nMock = {
  global: {
    n: vi.fn((n) => n.toString()),
  },
}

const { amount, GDD } = createFilters(i18nMock)

describe('amount filters', () => {
  describe('amount', () => {
    it('returns empty string when called with null', () => {
      expect(amount(null)).toBe('')
    })

    it('returns empty string when called with undefined', () => {
      expect(amount(undefined)).toBe('')
    })

    it('returns 0 when called with 0', () => {
      expect(amount(0)).toBe('0')
    })

    it('returns a leading proper minus sign when called with negative value', () => {
      i18nMock.global.n.mockReturnValueOnce('-1')
      expect(amount(-1)).toBe('− 1')
    })

    it('returns empty string when called with non-numeric string', () => {
      expect(amount('not a number')).toBe('')
    })
  })

  describe('GDD', () => {
    it('returns empty string when called with null', () => {
      expect(GDD(null)).toBe('')
    })

    it('returns empty string when called with undefined', () => {
      expect(GDD(undefined)).toBe('')
    })

    it('returns "+ 0 GDD" when called with 0', () => {
      i18nMock.global.n.mockReturnValueOnce('0')
      expect(GDD(0)).toBe('+ 0 GDD')
    })

    it('returns a leading proper minus sign when called with negative value', () => {
      i18nMock.global.n.mockReturnValueOnce('-1')
      expect(GDD(-1)).toBe('− 1 GDD')
    })

    it('returns a leading plus sign when called with positive value', () => {
      i18nMock.global.n.mockReturnValueOnce('1')
      expect(GDD(1)).toBe('+ 1 GDD')
    })

    it('returns empty string when called with not a number value', () => {
      expect(GDD('not a number')).toBe('')
    })
  })
})
