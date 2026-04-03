import { describe, expect, it } from 'bun:test'
import { GradidoUnit } from 'shared-native'
import { Decay } from './Decay'

describe('Decay', () => {
  it('calculateDecay', () => {
    const decay = new Decay(new GradidoUnit(1000))
    decay.calculateDecay(new Date('2021-05-10'), new Date('2021-05-14'))
    expect(decay.decay.toNumber()).toBe(-0.4921)
  })
  it('toString', () => {
    const decay = new Decay(new GradidoUnit(1000))
    decay.calculateDecay(new Date('2022-01-01'), new Date('2022-02-01'))
    expect(decay.toString()).toBe('2022-01-01T00:00:00.000Z -> 2022-02-01T00:00:00.000Z = 2678400 seconds, 942.8661 GDD - -57.1339 GDD (-57.13 GDD)')
  })
  it('toJSON', () => {
    const decay = new Decay(new GradidoUnit(1000))
    decay.calculateDecay(new Date('2022-01-01'), new Date('2022-02-01'))
    expect(decay.toJSON()).toEqual({
      balance: '942.8661',
      decay: '-57.1339',
      roundedDecay: '-57.13',
      start: '2022-01-01T00:00:00.000Z',
      end: '2022-02-01T00:00:00.000Z',
      duration: 2678400,
    })
  })
})
