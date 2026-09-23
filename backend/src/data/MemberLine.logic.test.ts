// AI-GENERATED — not an architecture reference
import { inMemberLine, membersInLine } from './MemberLine.logic'

// A promise the test opens by hand, to hold a caller inside the line.
const gate = () => {
  let open = (): void => undefined
  const opened = new Promise<void>((resolve) => {
    open = resolve
  })
  return { open, opened }
}

// Lets everything run that can run: a macrotask comes only after all pending microtasks.
const settle = () => new Promise((resolve) => setImmediate(resolve))

describe('inMemberLine', () => {
  it('runs the callers for one member one after another, in the order they came', async () => {
    const log: string[] = []
    const gates = [gate(), gate(), gate()]
    const caller = (n: number) =>
      inMemberLine(1, async () => {
        log.push(`start ${n}`)
        await gates[n].opened
        log.push(`end ${n}`)
        return n
      })
    const runs = [caller(0), caller(1)]
    await settle()
    expect(log).toEqual(['start 0'])

    gates[0].open()
    await settle()
    expect(log).toEqual(['start 0', 'end 0', 'start 1'])

    // Comes after the first has left, while the second is inside - and is free to finish at
    // once: it still waits for the second.
    runs.push(caller(2))
    gates[2].open()
    await settle()
    expect(log).toEqual(['start 0', 'end 0', 'start 1'])

    gates[1].open()
    await expect(Promise.all(runs)).resolves.toEqual([0, 1, 2])
    expect(log).toEqual(['start 0', 'end 0', 'start 1', 'end 1', 'start 2', 'end 2'])
  })

  it('lets another member through while one waits', async () => {
    const held = gate()
    const waiting = inMemberLine(1, () => held.opened)
    let through = false
    const other = inMemberLine(2, async () => {
      through = true
    })

    await settle()
    expect(through).toBe(true)

    held.open()
    await Promise.all([waiting, other])
  })

  it('runs the next caller after one that threw, and hands the thrower its own error', async () => {
    const log: string[] = []
    const refused = inMemberLine(1, async () => {
      log.push('refused')
      throw new Error('Vouching limit reached')
    })
    const next = inMemberLine(1, async () => {
      log.push('next')
      return 'opened'
    })

    await expect(refused).rejects.toThrow('Vouching limit reached')
    await expect(next).resolves.toBe('opened')
    expect(log).toEqual(['refused', 'next'])
  })

  it('forgets a member as soon as nobody waits in their line, also after a caller threw', async () => {
    const held = gate()
    const runs = [
      inMemberLine(1, () => held.opened),
      inMemberLine(1, async () => {
        throw new Error('Vouching limit reached')
      }),
      inMemberLine(2, async () => undefined),
    ]
    // Taken before anything is asserted: a failed expectation must not leave the thrower's
    // rejection unhandled, it would end the whole test process.
    const settled = Promise.allSettled(runs)
    expect(membersInLine()).toBe(2)

    held.open()
    await settled
    expect(membersInLine()).toBe(0)
  })
})
