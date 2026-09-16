// AI-GENERATED — not an architecture reference
import { splitMemberRefsByCommunity } from './MemberAvatars.logic'

const HOME = '11111111-1111-4111-8111-111111111111'
const OTHER = '22222222-2222-4222-8222-222222222222'
const THIRD = '33333333-3333-4333-8333-333333333333'

describe('splitMemberRefsByCommunity', () => {
  it('answers a ref without a community, and one of this community, here', () => {
    const { home, foreign } = splitMemberRefsByCommunity(
      [
        { gradidoID: 'anna', communityUuid: null },
        { gradidoID: 'ben' },
        { gradidoID: 'carla', communityUuid: HOME },
      ],
      HOME,
    )
    expect(home).toEqual(['anna', 'ben', 'carla'])
    expect(foreign.size).toBe(0)
  })

  it('groups the members of other communities by their community', () => {
    const { home, foreign } = splitMemberRefsByCommunity(
      [
        { gradidoID: 'anna', communityUuid: OTHER },
        { gradidoID: 'ben', communityUuid: HOME },
        { gradidoID: 'carla', communityUuid: THIRD },
        { gradidoID: 'dora', communityUuid: OTHER },
      ],
      HOME,
    )
    expect(home).toEqual(['ben'])
    expect([...foreign]).toEqual([
      [OTHER, ['anna', 'dora']],
      [THIRD, ['carla']],
    ])
  })

  // A booking list names a member once per booking; each community is asked about each once.
  it('names each member once per community', () => {
    const { home, foreign } = splitMemberRefsByCommunity(
      [
        { gradidoID: 'anna', communityUuid: OTHER },
        { gradidoID: 'anna', communityUuid: OTHER },
        { gradidoID: 'ben', communityUuid: HOME },
        { gradidoID: 'ben', communityUuid: null },
      ],
      HOME,
    )
    expect(home).toEqual(['ben'])
    expect(foreign.get(OTHER)).toEqual(['anna'])
  })

  // The identity is the pair: the same id in two communities is two people.
  it('keeps the same id apart when two communities carry it', () => {
    const { home, foreign } = splitMemberRefsByCommunity(
      [
        { gradidoID: 'anna', communityUuid: HOME },
        { gradidoID: 'anna', communityUuid: OTHER },
      ],
      HOME,
    )
    expect(home).toEqual(['anna'])
    expect(foreign.get(OTHER)).toEqual(['anna'])
  })

  it('has nothing to split in an empty list', () => {
    const { home, foreign } = splitMemberRefsByCommunity([], HOME)
    expect(home).toEqual([])
    expect(foreign.size).toBe(0)
  })
})
