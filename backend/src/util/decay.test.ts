import decayFunction from './decay'

describe('utils/decay', () => {
  it('has base 0.99999997802044727', () => {
    const now = new Date()
    now.setSeconds(1)
    const oneSecondAgo = new Date(now.getTime())
    oneSecondAgo.setSeconds(0)
    expect(decayFunction(1.0, oneSecondAgo, now)).toBe(0.99999997802044727)
  })

  it('returns input amount when from and to is the same', () => {
    const now = new Date()
    expect(decayFunction(100.0, now, now)).toBe(100.0)
  })
})
