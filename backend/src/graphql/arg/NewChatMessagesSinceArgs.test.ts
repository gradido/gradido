// AI-GENERATED — not an architecture reference
import { MemberAvatarRefInput } from '@input/MemberAvatarRefInput'
import { validate } from 'class-validator'
import { CHAT_UPDATE_READ_BY_MAX } from '@/data/ChatConversation.logic'
import { NewChatMessagesSinceArgs } from './NewChatMessagesSinceArgs'

/**
 * Whose read state one beat may ask about (`readBy`, Chat E-093), with the options type-graphql
 * validates with (graphql/schema.ts): up to CHAT_UPDATE_READ_BY_MAX members, refused above, and
 * each of them checked as a member reference.
 */
const SCHEMA_VALIDATE_OPTIONS = {
  validationError: { target: false },
  skipMissingProperties: true,
  skipNullProperties: true,
  skipUndefinedProperties: false,
  forbidUnknownValues: true,
  stopAtFirstError: true,
}

const member = (gradidoID: string): MemberAvatarRefInput =>
  Object.assign(new MemberAvatarRefInput(), {
    gradidoID,
    communityUuid: '11111111-1111-4111-8111-111111111111',
  })
const members = (count: number) =>
  Array.from({ length: count }, (_, n) =>
    member(`aaaaaaaa-aaaa-4aaa-8aaa-${String(n).padStart(12, '0')}`),
  )

const refusals = async (readBy?: MemberAvatarRefInput[] | null) =>
  validate(
    Object.assign(new NewChatMessagesSinceArgs(), {
      afterId: 60,
      ...(readBy === undefined ? {} : { readBy }),
    }),
    SCHEMA_VALIDATE_OPTIONS,
  )

describe('NewChatMessagesSinceArgs, whose read state is asked about', () => {
  it('takes as many members as the cap, and refuses one more', async () => {
    expect(await refusals(members(CHAT_UPDATE_READ_BY_MAX))).toEqual([])
    const refused = await refusals(members(CHAT_UPDATE_READ_BY_MAX + 1))
    expect(refused.map((error) => error.property)).toEqual(['readBy'])
  })

  // A wallet from before the ticks names nobody, and so does one with no conversation open.
  it('takes nobody, null, and no argument at all', async () => {
    expect(await refusals([])).toEqual([])
    expect(await refusals(null)).toEqual([])
    expect(await refusals(undefined)).toEqual([])
  })

  it('checks each member it is handed', async () => {
    const refused = await refusals([member('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'), member('')])
    expect(refused.map((error) => error.property)).toEqual(['readBy'])
  })
})
