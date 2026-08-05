import { creationGroupsByContribution } from './creationGroupsByContribution'

// No database here on purpose: this is the half that can be wrong, and it is worth being
// able to run it in half a second.

const tags = [
  { id: 1, tag: 'music' },
  { id: 2, tag: 'amstetten' },
  { id: 3, tag: 'sports' },
]

describe('creationGroupsByContribution', () => {
  it('groups the links under their contribution', () => {
    const result = creationGroupsByContribution(
      [
        { contributionId: 10, creationGroupId: 1 },
        { contributionId: 11, creationGroupId: 3 },
      ],
      tags,
    )

    expect(result.get(10)?.map((t) => t.tag)).toEqual(['music'])
    expect(result.get(11)?.map((t) => t.tag)).toEqual(['sports'])
  })

  // ★ The point of the whole change. The links arrive in insertion order, so without the
  // sort a contribution in several groups is displayed in whatever order the rows happen to
  // carry -- and nothing downstream re-sorts. The old code did ask the database to sort, but
  // threw that away: those rows went into a Map keyed by id while the output was built by
  // walking the links.
  it('sorts the groups of one contribution alphabetically, whatever order the links came in', () => {
    const result = creationGroupsByContribution(
      [
        { contributionId: 10, creationGroupId: 3 },
        { contributionId: 10, creationGroupId: 1 },
        { contributionId: 10, creationGroupId: 2 },
      ],
      tags,
    )

    expect(result.get(10)?.map((t) => t.tag)).toEqual(['amstetten', 'music', 'sports'])
  })

  it('sorts every contribution, not just the first', () => {
    const result = creationGroupsByContribution(
      [
        { contributionId: 10, creationGroupId: 3 },
        { contributionId: 10, creationGroupId: 2 },
        { contributionId: 11, creationGroupId: 1 },
        { contributionId: 11, creationGroupId: 2 },
      ],
      tags,
    )

    expect(result.get(10)?.map((t) => t.tag)).toEqual(['amstetten', 'sports'])
    expect(result.get(11)?.map((t) => t.tag)).toEqual(['amstetten', 'music'])
  })

  // A link whose group is gone must be skipped, not rendered as a hole.
  it('skips a link whose group is not among the canonical rows', () => {
    const result = creationGroupsByContribution(
      [
        { contributionId: 10, creationGroupId: 1 },
        { contributionId: 10, creationGroupId: 99 },
      ],
      tags,
    )

    expect(result.get(10)?.map((t) => t.tag)).toEqual(['music'])
  })

  it('returns nothing for a contribution without links', () => {
    const result = creationGroupsByContribution([{ contributionId: 10, creationGroupId: 1 }], tags)

    expect(result.get(11)).toBeUndefined()
  })

  it('survives empty input', () => {
    expect(creationGroupsByContribution([], tags).size).toBe(0)
    expect(
      creationGroupsByContribution([{ contributionId: 10, creationGroupId: 1 }], []).size,
    ).toBe(0)
  })
})
