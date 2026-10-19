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
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(asked).toEqual([0, 1, 2, 3, 4, 5, 6])

    releaseSlow?.()
    expect(await answers).toEqual([0, 1, 2, 3, 4, 5, 6])
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
