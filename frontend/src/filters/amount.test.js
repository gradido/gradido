import { loadFilters } from './amount'

const i18nMock = {
  n: jest.fn((n) => n),
}

const { amount, GDD } = loadFilters(i18nMock)

describe('amount', () => {
  it('returns empty string when called with null', () => {
    expect(amount(null)).toBe('')
  })

  it('returns 0 when called with 0', () => {
    expect(amount(0)).toBe('0')
  })

  it('returns a leading proper minus sign when called with negative value', () => {
    expect(amount(-1)).toBe('− 1')
  })
})

describe('GDD', () => {
  it('returns empty string when called with null', () => {
    expect(GDD(null)).toBe('')
  })

  it('returns "+ 0 GDD" when called with 0', () => {
    expect(GDD(0)).toBe('+ 0 GDD')
  })

  it('returns a leading proper minus sign when called with negative value', () => {
    expect(GDD(-1)).toBe('− 1 GDD')
  })
})
