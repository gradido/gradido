// AI-GENERATED — not an architecture reference
import { beforeEach, describe, expect, it, mock, setSystemTime } from 'bun:test'
import type { DocumentNode } from 'graphql'
import * as v from 'valibot'

// the answers `request` gives, in the order they are asked for; each resolves when told to
let answers: ((value: unknown) => void)[] = []
const request = mock(() => new Promise((resolve) => answers.push(resolve)))
mock.module('@/graphql/client', () => ({ request }))

const { Resource } = await import('./Resource')

const document = {} as DocumentNode
const schema = v.object({ balance: v.number() })
const answer = (balance: number) => ({ success: true, value: { balance } })

beforeEach(() => {
  answers = []
  request.mockClear()
  setSystemTime(new Date('2026-11-21T10:00:00Z'))
})

describe('Resource', () => {
  it('asks once for two readers and keeps the answer', async () => {
    const fact = new Resource(document, schema)
    const both = Promise.all([fact.ensureLoaded(), fact.ensureLoaded()])
    answers[0](answer(5))
    await both
    expect(request).toHaveBeenCalledTimes(1)
    expect(fact.value).toEqual({ balance: 5 })
  })

  it('asks again only once the answer is older than its limit, whatever was read', async () => {
    const fact = new Resource(document, schema, 60_000)
    const first = fact.ensureLoaded()
    answers[0](answer(5))
    await first
    setSystemTime(new Date('2026-11-21T10:00:59Z'))
    expect(fact.value).toEqual({ balance: 5 })
    await fact.ensureLoaded()
    expect(request).toHaveBeenCalledTimes(1)
    setSystemTime(new Date('2026-11-21T10:01:00Z'))
    const second = fact.ensureLoaded()
    // the last value stays on screen meanwhile
    expect(fact.value).toEqual({ balance: 5 })
    answers[1](answer(7))
    await second
    expect(fact.value).toEqual({ balance: 7 })
  })

  it('takes the newest answer and drops an older one that arrives late', async () => {
    const fact = new Resource(document, schema)
    const older = fact.ensureLoaded(0)
    setSystemTime(new Date('2026-11-21T10:00:01Z'))
    const newer = fact.ensureLoaded(0)
    answers[1](answer(2))
    await newer
    answers[0](answer(1))
    await older
    expect(fact.value).toEqual({ balance: 2 })
  })

  it('keeps the value and says why where a question fails', async () => {
    const fact = new Resource(document, schema)
    const first = fact.ensureLoaded()
    answers[0](answer(5))
    await first
    setSystemTime(new Date('2026-11-21T10:00:01Z'))
    const failed = fact.ensureLoaded(0)
    answers[1]({ success: false, error: new Error('no network') })
    await failed
    expect(fact.value).toEqual({ balance: 5 })
    expect(fact.error?.message).toBe('no network')
    // a failed question does not count as an answer
    fact.ensureLoaded()
    expect(request).toHaveBeenCalledTimes(3)
  })

  // `request` throws for a mistake in the code, or a token the wallet cannot read
  it('hands on what `request` throws, and asks again for the next reader', async () => {
    const fact = new Resource(document, schema)
    request.mockImplementationOnce(() => Promise.reject(new Error('Invalid Login Response')))
    await expect(fact.ensureLoaded()).rejects.toThrow('Invalid Login Response')
    const second = fact.ensureLoaded()
    answers[0](answer(5))
    await second
    expect(fact.value).toEqual({ balance: 5 })
  })

  it('counts a question of the last 100 ms as current', async () => {
    const fact = new Resource(document, schema)
    const first = fact.ensureLoaded(0)
    answers[0](answer(5))
    await first
    setSystemTime(new Date('2026-11-21T10:00:00.099Z'))
    await fact.ensureLoaded(0)
    expect(request).toHaveBeenCalledTimes(1)
    setSystemTime(new Date('2026-11-21T10:00:00.100Z'))
    fact.ensureLoaded(0)
    expect(request).toHaveBeenCalledTimes(2)
  })

  it('asks anew with other variables, and drops the answer to the last ones', async () => {
    const fact = new Resource(document, schema)
    const first = fact.ensureLoaded(undefined, { of: 'a' })
    const second = fact.ensureLoaded(undefined, { of: 'b' })
    expect(request).toHaveBeenCalledTimes(2)
    answers[0](answer(1))
    await first
    expect(fact.value).toBeUndefined()
    answers[1](answer(2))
    await second
    expect(fact.value).toEqual({ balance: 2 })
    expect(fact.loading).toBe(false)
    // the same again counts as asked
    await fact.ensureLoaded(undefined, { of: 'b' })
    expect(request).toHaveBeenCalledTimes(2)
    fact.ensureLoaded(undefined, { of: 'a' })
    expect(fact.value).toBeUndefined()
    expect(fact.loading).toBe(true)
  })
})
