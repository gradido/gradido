import { decayFormula, calculateDecay } from './decay'

describe('utils/decay', () => {
  describe('decayFormula', () => {
    it('has base 0.99999997802044727', async () => {
      const amount = 1.0
      const seconds = 1
      expect(await decayFormula(amount, seconds)).toBe(0.99999997802044727)
    })
    // Not sure if the following skiped tests make sence!?
    it.skip('has negative decay?', async () => {
      const amount = -1.0
      const seconds = 1
      expect(await decayFormula(amount, seconds)).toBe(-0.99999997802044727)
    })
    it.skip('has correct backward calculation', async () => {
      const amount = 1.0
      const seconds = -1
      expect(await decayFormula(amount, seconds)).toBe(1.0000000219795533)
    })
    it.skip('has correct forward calculation', async () => {
      const amount = 1.000000219795533
      const seconds = 1
      expect(await decayFormula(amount, seconds)).toBe(1.0)
    })
  })
  it.skip('has base 0.99999997802044727', async () => {
    const now = new Date()
    now.setSeconds(1)
    const oneSecondAgo = new Date(now.getTime())
    oneSecondAgo.setSeconds(0)
    expect(await calculateDecay(1.0, oneSecondAgo, now)).toBe(0.99999997802044727)
  })

  it.skip('returns input amount when from and to is the same', async () => {
    const now = new Date()
    expect(await calculateDecay(100.0, now, now)).toBe(100.0)
  })
})
