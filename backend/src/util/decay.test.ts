import { calculateDecay } from './decay'


describe('utils/decay', () => {
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
