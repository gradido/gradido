import { transactionLinkCode } from './TransactionLinkResolver'

describe('transactionLinkCode', () => {
  const date = new Date()

  it('returns a string of length 24', () => {
    expect(transactionLinkCode(date)).toHaveLength(24)
  })

  it('returns a string that ends with the hex value of date', () => {
    const regexp = new RegExp(date.getTime().toString(16) + '$')
    expect(transactionLinkCode(date)).toEqual(expect.stringMatching(regexp))
  })
})
