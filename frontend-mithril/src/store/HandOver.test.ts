// AI-GENERATED — not an architecture reference
import { describe, expect, it, setSystemTime } from 'bun:test'
import { HandOver } from './HandOver'

describe('HandOver', () => {
  it('gives what was left once', () => {
    const handOver = new HandOver<string>()
    expect(handOver.take()).toBeUndefined()
    handOver.put('link')
    expect(handOver.take()).toBe('link')
    expect(handOver.take()).toBeUndefined()
  })

  it('gives nothing that waited too long', () => {
    setSystemTime(new Date(1760000000000))
    const handOver = new HandOver<number>(600_000)
    handOver.put(7)
    setSystemTime(new Date(1760000600001))
    expect(handOver.take()).toBeUndefined()
    handOver.put(8)
    expect(handOver.take()).toBe(8)
    setSystemTime()
  })

  it('takes back only what still waits', () => {
    const handOver = new HandOver<object>()
    const first = {}
    handOver.put(first)
    handOver.put({})
    handOver.drop(first)
    expect(handOver.take()).toBeDefined()
    handOver.put(first)
    handOver.drop(first)
    expect(handOver.take()).toBeUndefined()
  })
})
