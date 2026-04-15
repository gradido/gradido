import { describe, expect, it } from 'bun:test'
import { Duration } from './Duration'

describe('Duration', () => {
  it('should create a duration from a date diff', () => {
    const from = new Date('2020-01-01T00:00:00Z')
    const to = new Date('2020-01-02T03:04:05Z')
    const duration = Duration.fromDateDiff(from, to)
    expect(duration.seconds).toBe(97445n)
  })

  it('should create a duration from days', () => {
    const duration = Duration.days(1n)
    expect(duration.seconds).toBe(86400n)
  })

  it('should create a duration from hours', () => {
    const duration = Duration.hours(1n)
    expect(duration.seconds).toBe(3600n)
  })

  it('should create a duration from minutes', () => {
    const duration = Duration.minutes(1n)
    expect(duration.seconds).toBe(60n)
  })

  it('should create a duration from seconds', () => {
    const duration = Duration.seconds(1n)
    expect(duration.seconds).toBe(1n)
  })

  it('should add durations', () => {
    const duration1 = Duration.seconds(1n)
    const duration2 = Duration.seconds(2n)
    const result = duration1.add(duration2)
    expect(result.seconds).toBe(3n)
  })

  it('should subtract durations', () => {
    const duration1 = Duration.seconds(3n)
    const duration2 = Duration.seconds(2n)
    const result = duration1.subtract(duration2)
    expect(result.seconds).toBe(1n)
  })

  it('should create from mixed input, using add', () => {
    const duration = Duration.days(1n).add(
      Duration.hours(2n).add(Duration.minutes(3n).add(Duration.seconds(4n))),
    )
    expect(duration.seconds).toBe(93784n)
  })
})
