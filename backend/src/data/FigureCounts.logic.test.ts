// AI-GENERATED — not an architecture reference
// Unit tests: how the counts of the figures are asked. Nothing to replace -- the counts are
// handed in.
import { COUNTS_AT_ONCE, countInTurns } from './FigureCounts.logic'

describe('countInTurns', () => {
  it('asks four at a time and answers in the order of the counts, whichever came first', async () => {
    // The early counts wait longest, so that the answers come in another order than asked.
    let asking = 0
    let mostAtOnce = 0
    const counts = Array.from({ length: 10 }, (_, index) => async () => {
      asking++
      mostAtOnce = Math.max(mostAtOnce, asking)
      await new Promise((resolve) => setTimeout(resolve, 30 - index * 3))
      asking--
      return index
    })

    expect(await countInTurns(counts)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
    expect(COUNTS_AT_ONCE).toBe(4)
    expect(mostAtOnce).toBe(COUNTS_AT_ONCE)
  })

  it('asks the next count as soon as one has answered', async () => {
    // One slow count and many quick ones: the quick ones do not wait for the slow one.
    const asked: number[] = []
    let releaseSlow: (() => void) | undefined
    const slow = async () => {
      asked.push(0)
      await new Promise<void>((resolve) => {
        releaseSlow = resolve
      })
      return 0
    }
    const quick = (index: number) => async () => {
      asked.push(index)
      return index
    }
    const answers = countInTurns([slow, ...[1, 2, 3, 4, 5, 6].map(quick)])
    try {
      await new Promise((resolve) => setTimeout(resolve, 0))
      expect(asked).toEqual([0, 1, 2, 3, 4, 5, 6])
    } finally {
      // Its turn ends either way: the turns are the process's, and the next test needs them.
      releaseSlow?.()
    }
    expect(await answers).toEqual([0, 1, 2, 3, 4, 5, 6])
  })

  it('asks four at a time over every call, also a call that comes while counts wait their turn', async () => {
    // The table and its weeks are asked together, and a second moderator may come in while the
    // first one's counts still wait: a turn that ends goes to a count that waits, never to both.
    let asking = 0
    let mostAtOnce = 0
    const countsOf = (call: number) =>
      Array.from({ length: 8 }, (_, index) => async () => {
        asking++
        mostAtOnce = Math.max(mostAtOnce, asking)
        await new Promise((resolve) => setTimeout(resolve, 5 + ((index * 7) % 11)))
        asking--
        return `${call}.${index}`
      })

    const first = countInTurns(countsOf(1))
    // Some counts of the first call have ended by now, and some of it still wait.
    await new Promise((resolve) => setTimeout(resolve, 10))
    const second = countInTurns(countsOf(2))

    expect(await first).toEqual(['1.0', '1.1', '1.2', '1.3', '1.4', '1.5', '1.6', '1.7'])
    expect(await second).toEqual(['2.0', '2.1', '2.2', '2.3', '2.4', '2.5', '2.6', '2.7'])
    expect(mostAtOnce).toBe(COUNTS_AT_ONCE)
  })

  it('takes up the turns again after a call whose count failed', async () => {
    const failing = async () => {
      throw new Error('count failed')
    }
    await expect(countInTurns([failing, failing, failing, failing, failing])).rejects.toThrow()
    // Every turn came back: four counts run at once again, not fewer.
    let asking = 0
    let mostAtOnce = 0
    const counts = Array.from({ length: 8 }, () => async () => {
      asking++
      mostAtOnce = Math.max(mostAtOnce, asking)
      await new Promise((resolve) => setTimeout(resolve, 5))
      asking--
    })
    await countInTurns(counts)
    expect(mostAtOnce).toBe(COUNTS_AT_ONCE)
  })

  it('fails as a whole where a count fails', async () => {
    const failing = async () => {
      throw new Error('count failed')
    }

    await expect(countInTurns([async () => 1, failing, async () => 3])).rejects.toThrow(
      'count failed',
    )
  })

  it('asks nothing where there is nothing to count', async () => {
    expect(await countInTurns([])).toEqual([])
  })
})
