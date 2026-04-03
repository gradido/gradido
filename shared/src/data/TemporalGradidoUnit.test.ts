import { describe, expect, it } from 'bun:test'
import { GradidoUnit } from 'shared-native'
import { TemporalGradidoUnit } from './TemporalGradidoUnit'

describe('TemporalGradidoUnit', () => {
  it('equal', () => {
    const balance1 = new TemporalGradidoUnit(new GradidoUnit(100), new Date('2022-01-01'))
    const balance2 = new TemporalGradidoUnit(new GradidoUnit(100), new Date('2022-01-02'))
    const balance3 = new TemporalGradidoUnit(new GradidoUnit(200), new Date('2022-01-01'))
    expect(balance1.equal(balance1)).toBeTrue()
    expect(balance1.eq(balance2)).toBeFalse()
    expect(balance1.eq(balance3)).toBeFalse()
  })
  it('notEqual', () => {
    const balance1 = new TemporalGradidoUnit(new GradidoUnit(100), new Date('2022-01-01'))
    const balance2 = new TemporalGradidoUnit(new GradidoUnit(100), new Date('2022-01-02'))
    expect(balance1.notEqual(balance2)).toBeTrue()
    expect(balance1.ne(balance2)).toBeTrue()
    expect(balance1.ne(balance1)).toBeFalse()
  })
  it('plus', () => {
    const balance1 = new TemporalGradidoUnit(new GradidoUnit(100), new Date('2022-01-01'))
    const balance2 = new TemporalGradidoUnit(new GradidoUnit(100), new Date('2022-01-02'))
    const expected = new TemporalGradidoUnit(
      new GradidoUnit(100).decay(60 * 60 * 24).add(new GradidoUnit(100)),
      new Date('2022-01-02')
    )
    const result = balance1.plus(balance2)
    expect(balance1.balance.toNumber()).toBe(100)
    expect(balance2.balance.toNumber()).toBe(100)
    expect(result.balance.toNumber()).toBe(199.8104)
    expect(result.eq(expected)).toBeTrue()
  })
  it('add', () => {
    const balance1 = new TemporalGradidoUnit(new GradidoUnit(100), new Date('2022-01-01'))
    const balance2 = new TemporalGradidoUnit(new GradidoUnit(100), new Date('2022-01-02'))
    const expected = new TemporalGradidoUnit(
      new GradidoUnit(100).decay(60 * 60 * 24).add(new GradidoUnit(100)),
      new Date('2022-01-02')
    )
    balance1.add(balance2)
    expect(balance1.eq(expected)).toBeTrue()
    expect(balance2.balance.toNumber()).toBe(100)
  })
  it('minus', () => {
    const balance1 = new TemporalGradidoUnit(new GradidoUnit(100), new Date('2022-01-01'))
    const balance2 = new TemporalGradidoUnit(new GradidoUnit(50), new Date('2022-01-02'))
    const balance3 = new TemporalGradidoUnit(new GradidoUnit(150), new Date('2022-01-03'))
    const expected = new TemporalGradidoUnit(
      new GradidoUnit(100).decay(60 * 60 * 24).sub(new GradidoUnit(50)),
      new Date('2022-01-02')
    )
    expect(() => balance1.minus(balance3)).toThrow('Subtraction would result in negative balance')
    const result = balance1.minus(balance2)
    expect(balance1.balance.toNumber()).toBe(100)
    expect(balance2.balance.toNumber()).toBe(50)
    expect(result.balance.toNumber()).toBe(49.8104)
    expect(result.eq(expected)).toBeTrue()
  })
  it('sub', () => {
    const balance1 = new TemporalGradidoUnit(new GradidoUnit(100), new Date('2022-01-01'))
    const balance2 = new TemporalGradidoUnit(new GradidoUnit(50), new Date('2022-01-02'))
    const balance3 = new TemporalGradidoUnit(new GradidoUnit(150), new Date('2022-01-03'))
    const expected = new TemporalGradidoUnit(
      new GradidoUnit(100).decay(60 * 60 * 24).sub(new GradidoUnit(50)),
      new Date('2022-01-02')
    )
    expect(() => balance1.sub(balance3)).toThrow('Subtraction would result in negative balance')
    expect(balance1.balance.toNumber()).toBe(100)
    balance1.sub(balance2)
    console.log({ balance1: balance1.balance.toNumber(), expected: expected.balance.toNumber() })
    expect(balance1.eq(expected)).toBeTrue()
    expect(balance2.balance.toNumber()).toBe(50)
  })
  
})
