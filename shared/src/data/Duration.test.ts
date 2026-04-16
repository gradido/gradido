import { describe, expect, it } from 'bun:test'
import { Duration } from './Duration'

describe('Duration', () => {
  it('should create a duration from a date diff', () => {
    const from = new Date('2020-01-01T00:00:00Z')
    const to = new Date('2020-01-02T03:04:05Z')
    const duration = Duration.fromDateDiff(from, to)
    expect(duration.toNumber()).toBe(97445)
  })

  it('should create a duration from days', () => {
    const duration = Duration.days(1)
    expect(duration.toNumber()).toBe(86400)
  })

  it('should create a duration from hours', () => {
    const duration = Duration.hours(1)
    expect(duration.toNumber()).toBe(3600)
  })

  it('should create a duration from minutes', () => {
    const duration = Duration.minutes(1)
    expect(duration.toNumber()).toBe(60)
  })

  it('should create a duration from seconds', () => {
    const duration = Duration.seconds(1)
    expect(duration.toNumber()).toBe(1)
  })

  it('should add durations', () => {
    const duration1 = Duration.seconds(1)
    const duration2 = Duration.seconds(2)
    const result = duration1.add(duration2)
    expect(result.toNumber()).toBe(3)
  })

  it('should subtract durations', () => {
    const duration1 = Duration.seconds(3)
    const duration2 = Duration.seconds(2)
    const result = duration1.subtract(duration2)
    expect(result.toNumber()).toBe(1)
  })

  it('should create from mixed input, using add', () => {
    const duration = Duration.days(1).add(
      Duration.hours(2).add(Duration.minutes(3).add(Duration.seconds(4))),
    )
    expect(duration.toNumber()).toBe(93784)
  })
})
