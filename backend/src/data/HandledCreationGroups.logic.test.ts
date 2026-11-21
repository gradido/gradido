// AI-GENERATED — not an architecture reference
import {
  HANDLED_CREATION_GROUPS_MAX,
  handledCreationGroupsOf,
  normaliseHandledCreationGroups,
  parseHandledCreationGroups,
  storedHandledCreationGroups,
} from './HandledCreationGroups.logic'

const CHOICE = '{"groupIds":[3,7],"untagged":true}'

describe('parseHandledCreationGroups', () => {
  it('reads the choice the column holds', () => {
    expect(parseHandledCreationGroups(CHOICE)).toEqual({ groupIds: [3, 7], untagged: true })
    expect(parseHandledCreationGroups('{"groupIds":[],"untagged":true}')).toEqual({
      groupIds: [],
      untagged: true,
    })
    expect(parseHandledCreationGroups('{"groupIds":[5],"untagged":false}')).toEqual({
      groupIds: [5],
      untagged: false,
    })
  })

  // Nothing ticked means everything, as before: never a choice that would show nothing.
  it('reads the choice of nothing as no choice', () => {
    expect(parseHandledCreationGroups('{"groupIds":[],"untagged":false}')).toBeNull()
  })

  it.each([
    ['null', null],
    ['nothing', undefined],
    ['an empty text', ''],
    ['broken JSON', '{"groupIds":[3'],
    ['a list', '[3,7]'],
    ['no "untagged"', '{"groupIds":[3]}'],
    ['a group that is no number', '{"groupIds":["garden"],"untagged":false}'],
    ['a group number below 1', '{"groupIds":[0],"untagged":false}'],
    ['a group number with a fraction', '{"groupIds":[1.5],"untagged":false}'],
  ])('reads %s as no choice', (_name, stored) => {
    expect(parseHandledCreationGroups(stored)).toBeNull()
  })
})

describe('handledCreationGroupsOf', () => {
  it('follows the choice of whoever sees every group', () => {
    expect(handledCreationGroupsOf(CHOICE, true)).toEqual({ groupIds: [3, 7], untagged: true })
  })

  // A moderator with an assigned scope: the scope is their list, a choice in the row counts not.
  it('follows no choice under an assigned scope', () => {
    expect(handledCreationGroupsOf(CHOICE, false)).toBeNull()
  })

  it('follows nothing where nothing is chosen', () => {
    expect(handledCreationGroupsOf(null, true)).toBeNull()
  })
})

describe('normaliseHandledCreationGroups', () => {
  it('names each group once, in ascending order', () => {
    expect(normaliseHandledCreationGroups([7, 3, 7, 12, 3], true)).toEqual({
      success: true,
      value: { groupIds: [3, 7, 12], untagged: true },
    })
  })

  it('takes the choice of nothing', () => {
    expect(normaliseHandledCreationGroups([], false)).toEqual({
      success: true,
      value: { groupIds: [], untagged: false },
    })
  })

  it(`takes ${HANDLED_CREATION_GROUPS_MAX} groups, also sent twice`, () => {
    const all = Array.from({ length: HANDLED_CREATION_GROUPS_MAX }, (_, index) => index + 1)
    const answer = normaliseHandledCreationGroups([...all, ...all], false)
    expect(answer.success && answer.value.groupIds).toHaveLength(HANDLED_CREATION_GROUPS_MAX)
  })

  it(`refuses ${HANDLED_CREATION_GROUPS_MAX + 1} groups`, () => {
    const many = Array.from({ length: HANDLED_CREATION_GROUPS_MAX + 1 }, (_, index) => index + 1)
    expect(normaliseHandledCreationGroups(many, false).success).toBe(false)
  })
})

describe('storedHandledCreationGroups', () => {
  it('writes the choice as the column holds it', () => {
    expect(storedHandledCreationGroups({ groupIds: [3, 7], untagged: true })).toBe(CHOICE)
  })

  it('writes the choice of nothing as null', () => {
    expect(storedHandledCreationGroups({ groupIds: [], untagged: false })).toBeNull()
  })

  it('writes "no group" alone', () => {
    expect(
      parseHandledCreationGroups(storedHandledCreationGroups({ groupIds: [], untagged: true })),
    ).toEqual({ groupIds: [], untagged: true })
  })
})
