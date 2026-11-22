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
    const both = Promise.all([fact.load(), fact.load()])
    answers[0](answer(5))
    await both
    expect(request).toHaveBeenCalledTimes(1)
    expect(fact.value).toEqual({ balance: 5 })
  })

  it('asks again only once the answer is older than its limit, whatever was read or assigned', async () => {
    const fact = new Resource(document, schema, 60_000)
    const first = fact.load()
    answers[0](answer(5))
    await first
    setSystemTime(new Date('2026-11-21T10:00:59Z'))
    fact.value = { balance: 6 }
    await fact.load()
    expect(request).toHaveBeenCalledTimes(1)
    setSystemTime(new Date('2026-11-21T10:01:00Z'))
    const second = fact.load()
    // the last value stays on screen meanwhile
    expect(fact.value).toEqual({ balance: 6 })
    answers[1](answer(7))
    await second
    expect(fact.value).toEqual({ balance: 7 })
  })

  it('takes the newest answer and drops an older one that arrives late', async () => {
    const fact = new Resource(document, schema)
    const older = fact.load(0)
    setSystemTime(new Date('2026-11-21T10:00:01Z'))
    const newer = fact.load(0)
    answers[1](answer(2))
    await newer
    answers[0](answer(1))
    await older
    expect(fact.value).toEqual({ balance: 2 })
  })

  it('drops an answer asked before the value was assigned', async () => {
    const fact = new Resource(document, schema)
    const asked = fact.load()
    fact.value = { balance: 9 }
    answers[0](answer(1))
    await asked
    expect(fact.value).toEqual({ balance: 9 })
  })

  it('keeps the value and says why where a question fails', async () => {
    const fact = new Resource(document, schema)
    const first = fact.load()
    answers[0](answer(5))
    await first
    setSystemTime(new Date('2026-11-21T10:00:01Z'))
    const failed = fact.load(0)
    answers[1]({ success: false, error: new Error('no network') })
    await failed
    expect(fact.value).toEqual({ balance: 5 })
    expect(fact.error?.message).toBe('no network')
    // a failed question does not count as an answer
    fact.load()
    expect(request).toHaveBeenCalledTimes(3)
  })

  it('counts a question of the last 100 ms as current', async () => {
    const fact = new Resource(document, schema)
    const first = fact.load(0)
    answers[0](answer(5))
    await first
    setSystemTime(new Date('2026-11-21T10:00:00.099Z'))
    await fact.load(0)
    expect(request).toHaveBeenCalledTimes(1)
    setSystemTime(new Date('2026-11-21T10:00:00.100Z'))
    fact.load(0)
    expect(request).toHaveBeenCalledTimes(2)
  })

  it('forgets the failure once the value is assigned', async () => {
    const fact = new Resource(document, schema)
    const failed = fact.load()
    answers[0]({ success: false, error: new Error('no network') })
    await failed
    fact.value = { balance: 3 }
    expect(fact.error).toBeUndefined()
  })
})
