// AI-GENERATED — not an architecture reference
import { isSameChatMember } from './ChatConversation.logic'

const HOME = '11111111-1111-4111-8111-111111111111'
const OTHER = '22222222-2222-4222-8222-222222222222'
const ANNA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const BEN = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'

describe('isSameChatMember', () => {
  it('knows a member by the whole pair', () => {
    expect(
      isSameChatMember(
        { communityUuid: HOME, gradidoId: ANNA },
        { communityUuid: HOME, gradidoId: ANNA },
      ),
    ).toBe(true)
    expect(
      isSameChatMember(
        { communityUuid: HOME, gradidoId: ANNA },
        { communityUuid: HOME, gradidoId: BEN },
      ),
    ).toBe(false)
    // The same gradido id in another community is another person.
    expect(
      isSameChatMember(
        { communityUuid: HOME, gradidoId: ANNA },
        { communityUuid: OTHER, gradidoId: ANNA },
      ),
    ).toBe(false)
  })

  it('reads a uuid in capitals as the same uuid, as the columns compare', () => {
    expect(
      isSameChatMember(
        { communityUuid: HOME, gradidoId: ANNA },
        { communityUuid: HOME.toUpperCase(), gradidoId: ANNA.toUpperCase() },
      ),
    ).toBe(true)
  })
})
