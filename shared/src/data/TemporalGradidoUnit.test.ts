import { describe, expect, it } from 'bun:test'
import { Duration } from './Duration'
import { GradidoUnit } from './GradidoUnit'
import { TemporalGradidoUnit } from './TemporalGradidoUnit'

describe('TemporalGradidoUnit', () => {
  it('equal', () => {
    const balance1 = new TemporalGradidoUnit(GradidoUnit.fromNumber(100), new Date('2022-01-01'))
    const balance2 = new TemporalGradidoUnit(GradidoUnit.fromNumber(100), new Date('2022-01-02'))
    const balance3 = new TemporalGradidoUnit(GradidoUnit.fromNumber(200), new Date('2022-01-01'))
    expect(balance1.equal(balance1)).toBeTrue()
    expect(balance1.equal(balance2)).toBeFalse()
    expect(balance1.equal(balance3)).toBeFalse()
  })
  it('notEqual', () => {
    const balance1 = new TemporalGradidoUnit(GradidoUnit.fromNumber(100), new Date('2022-01-01'))
    const balance2 = new TemporalGradidoUnit(GradidoUnit.fromNumber(100), new Date('2022-01-02'))
    expect(balance1.notEqual(balance2)).toBeTrue()
    expect(balance1.notEqual(balance1)).toBeFalse()
  })
  it('add', () => {
    const balance1 = new TemporalGradidoUnit(GradidoUnit.fromNumber(100), new Date('2022-01-01'))
    const balance2 = new TemporalGradidoUnit(GradidoUnit.fromNumber(100), new Date('2022-01-02'))
    const expected = new TemporalGradidoUnit(
      GradidoUnit.fromNumber(100)
        .decayForDuration(Duration.hours(24n))
        .add(GradidoUnit.fromNumber(100)),
      new Date('2022-01-02'),
    )
    const result = balance1.add(balance2)
    expect(balance1.balance.toNumber()).toBe(100)
    expect(balance2.balance.toNumber()).toBe(100)
    expect(result.balance.toNumber()).toBe(199.8104)
    expect(result.equal(expected)).toBeTrue()
  })
  it('subtract', () => {
    const balance1 = new TemporalGradidoUnit(GradidoUnit.fromNumber(100), new Date('2022-01-01'))
    const balance2 = new TemporalGradidoUnit(GradidoUnit.fromNumber(50), new Date('2022-01-02'))
    const balance3 = new TemporalGradidoUnit(GradidoUnit.fromNumber(150), new Date('2022-01-03'))
    const expected = new TemporalGradidoUnit(
      GradidoUnit.fromNumber(100)
        .decayForDuration(Duration.hours(24n))
        .subtract(GradidoUnit.fromNumber(50)),
      new Date('2022-01-02'),
    )
    expect(() => balance1.subtract(balance3)).toThrow(
      'Subtraction would result in negative balance',
    )
    const result = balance1.subtract(balance2)
    expect(balance1.balance.toNumber()).toBe(100)
    expect(balance2.balance.toNumber()).toBe(50)
    expect(result.balance.toNumber()).toBe(49.8104)
    expect(result.equal(expected)).toBeTrue()
  })
})
