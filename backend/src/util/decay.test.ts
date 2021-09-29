import decayFunction from './decay'

describe('utils/decay', () => {
  it('has base 0.99999997802044727', () => {
    const now = new Date()
    now.setSeconds(1)
    const oneSecondAgo = new Date(now.getTime())
    oneSecondAgo.setSeconds(0)
    expect(decayFunction(1.0, oneSecondAgo, now)).toBe(0.99999997802044727)
  })
})
