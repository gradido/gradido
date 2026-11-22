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
    expect(parseHandledCreationGroups(CHOICE)).toEqual({
      groupIds: [3, 7],
      untagged: true,
      off: false,
    })
    expect(parseHandledCreationGroups('{"groupIds":[],"untagged":true}')).toEqual({
      groupIds: [],
      untagged: true,
      off: false,
    })
    expect(parseHandledCreationGroups('{"groupIds":[5],"untagged":false}')).toEqual({
      groupIds: [5],
      untagged: false,
      off: false,
    })
  })

  // MG5: off, with its ticks standing behind it -- and with none
  it('reads a choice that is off as a choice, its ticks with it', () => {
    expect(parseHandledCreationGroups('{"groupIds":[3],"untagged":true,"off":true}')).toEqual({
      groupIds: [3],
      untagged: true,
      off: true,
    })
    expect(parseHandledCreationGroups('{"groupIds":[],"untagged":false,"off":true}')).toEqual({
      groupIds: [],
      untagged: false,
      off: true,
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
    ['an "off" that is no boolean', '{"groupIds":[],"untagged":false,"off":"yes"}'],
  ])('reads %s as no choice', (_name, stored) => {
    expect(parseHandledCreationGroups(stored)).toBeNull()
  })
})

describe('handledCreationGroupsOf', () => {
  const administrator = { seesAllCreationGroups: true, maySwitchOff: true }
  const moderator = { seesAllCreationGroups: true, maySwitchOff: false }
  const scoped = { seesAllCreationGroups: false, maySwitchOff: false }

  it('follows the choice of whoever sees every group', () => {
    for (const holder of [administrator, moderator]) {
      expect(handledCreationGroupsOf(CHOICE, holder)).toEqual({
        groupIds: [3, 7],
        untagged: true,
        off: false,
      })
    }
  })

  // A moderator with an assigned scope: the scope is their list, a choice in the row counts not.
  it('follows no choice of a moderator with an assigned scope', () => {
    expect(handledCreationGroupsOf(CHOICE, scoped)).toBeNull()
  })

  it('follows nothing where nothing is chosen', () => {
    expect(handledCreationGroupsOf(null, administrator)).toBeNull()
  })

  // MG5: an administrator may handle nothing of the kind, the ticks kept behind it
  it('follows "off" of an administrator', () => {
    expect(
      handledCreationGroupsOf('{"groupIds":[3],"untagged":false,"off":true}', administrator),
    ).toEqual({ groupIds: [3], untagged: false, off: true })
  })

  // ... whose role became a moderator's: the ticks count, and where none stands, everything does
  it('follows no "off" of a moderator, the ticks behind it alone', () => {
    expect(
      handledCreationGroupsOf('{"groupIds":[3],"untagged":true,"off":true}', moderator),
    ).toEqual({ groupIds: [3], untagged: true, off: false })
    expect(
      handledCreationGroupsOf('{"groupIds":[],"untagged":false,"off":true}', moderator),
    ).toBeNull()
    expect(
      handledCreationGroupsOf('{"groupIds":[3],"untagged":true,"off":true}', scoped),
    ).toBeNull()
  })
})

describe('normaliseHandledCreationGroups', () => {
  it('names each group once, in ascending order', () => {
    expect(normaliseHandledCreationGroups([7, 3, 7, 12, 3], true, false)).toEqual({
      success: true,
      value: { groupIds: [3, 7, 12], untagged: true, off: false },
    })
  })

  it('takes the choice of nothing', () => {
    expect(normaliseHandledCreationGroups([], false, false)).toEqual({
      success: true,
      value: { groupIds: [], untagged: false, off: false },
    })
  })

  it(`takes ${HANDLED_CREATION_GROUPS_MAX} groups, also sent twice`, () => {
    const all = Array.from({ length: HANDLED_CREATION_GROUPS_MAX }, (_, index) => index + 1)
    const answer = normaliseHandledCreationGroups([...all, ...all], false, false)
    expect(answer.success && answer.value.groupIds).toHaveLength(HANDLED_CREATION_GROUPS_MAX)
  })

  it(`refuses ${HANDLED_CREATION_GROUPS_MAX + 1} groups`, () => {
    const many = Array.from({ length: HANDLED_CREATION_GROUPS_MAX + 1 }, (_, index) => index + 1)
    expect(normaliseHandledCreationGroups(many, false, false).success).toBe(false)
  })
})

describe('storedHandledCreationGroups', () => {
  const on = { off: false }

  // the text of a choice that is on says nothing of `off`: what it was before MG5
  it('writes the choice as the column holds it', () => {
    expect(storedHandledCreationGroups({ groupIds: [3, 7], untagged: true, ...on })).toBe(CHOICE)
  })

  it('writes the choice of nothing as null', () => {
    expect(storedHandledCreationGroups({ groupIds: [], untagged: false, ...on })).toBeNull()
  })

  it('writes "no group" alone', () => {
    expect(
      parseHandledCreationGroups(
        storedHandledCreationGroups({ groupIds: [], untagged: true, ...on }),
      ),
    ).toEqual({ groupIds: [], untagged: true, off: false })
  })

  it('writes "off" with the ticks standing behind it, also where none stands', () => {
    expect(storedHandledCreationGroups({ groupIds: [3], untagged: false, off: true })).toBe(
      '{"groupIds":[3],"untagged":false,"off":true}',
    )
    expect(storedHandledCreationGroups({ groupIds: [], untagged: false, off: true })).toBe(
      '{"groupIds":[],"untagged":false,"off":true}',
    )
  })
})
