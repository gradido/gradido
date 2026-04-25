import { describe, expect, it } from 'bun:test'
import { Duration } from './Duration'

describe('Duration', () => {
  it('should create a duration from a date diff', () => {
    const from = new Date('2020-01-01T00:00:00Z')
    const to = new Date('2020-01-02T03:04:05Z')
    const duration = Duration.fromDateDiff(from, to)
    expect(duration.seconds).toBe(97445n)
    expect(duration.toString(2)).toBe('1.12 days')
  })

  it('should create a duration from days', () => {
    const duration = Duration.days(1n)
    expect(duration.seconds).toBe(86400n)
    expect(duration.toString(2)).toBe('1.00 days')
  })

  it('should create a duration from hours', () => {
    const duration = Duration.hours(1n)
    expect(duration.seconds).toBe(3600n)
    expect(duration.toString(2)).toBe('1.00 h')
  })

  it('should create a duration from minutes', () => {
    const duration = Duration.minutes(1n)
    expect(duration.seconds).toBe(60n)
    expect(duration.toString(2)).toBe('1.00 min')
  })

  it('should create a duration from seconds', () => {
    const duration = Duration.seconds(1n)
    expect(duration.seconds).toBe(1n)
    expect(duration.toString(2)).toBe('1.00 s')
  })

  it('should add durations', () => {
    const duration1 = Duration.seconds(1n)
    const duration2 = Duration.seconds(2n)
    const result = duration1.add(duration2)
    expect(result.seconds).toBe(3n)
    expect(result.toString(2)).toBe('3.00 s')
  })

  it('should subtract durations', () => {
    const duration1 = Duration.seconds(3n)
    const duration2 = Duration.seconds(2n)
    const result = duration1.subtract(duration2)
    expect(result.seconds).toBe(1n)
    expect(result.toString(2)).toBe('1.00 s')
  })

  it('should create from mixed input, using add', () => {
    const duration = Duration.days(1n).add(
      Duration.hours(2n).add(Duration.minutes(3n).add(Duration.seconds(4n))),
    )
    expect(duration.seconds).toBe(93784n)
    expect(duration.toString(2)).toBe('1.08 days')
    expect(duration.toString(3)).toBe('1.085 days')
    expect(duration.toString(4)).toBe('1.0854 days')
  })
})
