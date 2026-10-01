// AI-GENERATED — not an architecture reference

import { getLogger } from 'config-schema/test/testSetup'
import {
  ChatConversationMemberSelect,
  ChatMessageSelect,
  User as DbUser,
  dbFindUsersByIds,
  dbSelectChatConversationMembers,
  dbSelectChatGroupUuids,
  dbSelectChatMessageForMember,
  dbSelectChatMessageImageInfos,
  dbSelectUsersByUuids,
  dbUpdateChatMessageBody,
} from 'database'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { Context, newRequestBudget } from '@/server/context'
import { ChatEditResolver } from './ChatEditResolver'

// What the database answers is mocked here: the subject is what the resolver decides itself when
// a member changes a message (E-060) -- whose message may be changed and which, that every
// refusal comes before anything is written, and that the write names the caller.
jest.mock('database', () => {
  const originalModule = jest.requireActual('database')
  return {
    __esModule: true,
    ...originalModule,
    dbSelectChatMessageForMember: jest.fn(),
    dbSelectChatConversationMembers: jest.fn(),
    dbSelectChatMessageImageInfos: jest.fn(),
    dbUpdateChatMessageBody: jest.fn(),
    dbSelectChatGroupUuids: jest.fn(),
    dbSelectUsersByUuids: jest.fn(),
    dbFindUsersByIds: jest.fn(),
    dbFindMemberAvatarTimestamps: jest.fn(async () => new Map()),
    getHomeCommunity: jest.fn(async () => ({ communityUuid: HOME, name: 'Gradido Akademie' })),
  }
})

// With letters in it: a test below spells it in capitals, and digits alone have no capitals.
const HOME = '1a1a1a1a-1111-4111-8111-11111111aaaa'
const ELSEWHERE = '22222222-2222-4222-8222-222222222222'
const LENA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const MAX = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const NORA = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
const GROUP = '30000000-0000-4000-8000-000000000009'
const MESSAGE = '40000000-0000-4000-8000-000000000001'
const PICTURE = '50000000-0000-4000-8000-000000000001'
const WITH_MAX = 21
const IN_GROUP = 9
const TEXT = 'Der Hofflohmarkt ist am Sonntag ab 11 Uhr.'
const NEW_TEXT = 'Der Hofflohmarkt ist am Samstag ab 10 Uhr.'
const EDITED_AT = new Date('2026-10-01T09:00:00.000Z')

const lenaUser = {
  id: 1,
  communityUuid: HOME,
  gradidoID: LENA,
  alias: 'lena',
  firstName: 'Lena',
  lastName: 'Near',
  language: 'de',
  foreign: false,
} as unknown as DbUser

/** A request of Lena's, with a budget of its own. */
const lenasRequest = (): Context => ({
  token: null,
  setHeaders: [],
  requestBudget: newRequestBudget(),
  user: lenaUser,
})

/** A message Lena wrote to Max. */
const row = (rest: Partial<ChatMessageSelect> = {}): ChatMessageSelect => ({
  id: 5,
  messageUuid: MESSAGE,
  conversationId: WITH_MAX,
  senderCommunityUuid: HOME,
  senderGradidoId: LENA,
  subject: null,
  body: TEXT,
  forwardedFromCommunityUuid: null,
  forwardedFromGradidoId: null,
  notify: 'none',
  mailState: null,
  deliveryState: 'delivered',
  lastAttemptAt: null,
  delaySeconds: null,
  createdAt: new Date('2026-09-30T14:28:00.000Z'),
  editedAt: null,
  deletedAt: null,
  ...rest,
})

const member = (
  conversationId: number,
  gradidoId: string,
  communityUuid = HOME,
): ChatConversationMemberSelect => ({
  conversationId,
  communityUuid,
  gradidoId,
  role: 'member',
  joinedAt: new Date('2026-09-29T08:00:00.000Z'),
  lastReadMessageId: null,
  mutedAt: null,
})

const source = dbSelectChatMessageForMember as jest.Mock
const membersOf = dbSelectChatConversationMembers as jest.Mock
const pictureInfos = dbSelectChatMessageImageInfos as jest.Mock
const update = dbUpdateChatMessageBody as jest.Mock
const groupUuids = dbSelectChatGroupUuids as jest.Mock
const byUuids = dbSelectUsersByUuids as jest.Mock
const usersByIds = dbFindUsersByIds as jest.Mock

const edit = (body = NEW_TEXT, messageUuid = MESSAGE) =>
  new ChatEditResolver().editChatMessage({ messageUuid, body }, lenasRequest())

const nothingWritten = () => expect(update).not.toHaveBeenCalled()

/** The message the database holds under MESSAGE, as the caller may read it. */
let held: ChatMessageSelect
const holds = (message: ChatMessageSelect) => {
  held = message
  source.mockResolvedValue({ success: true, value: message })
}

beforeEach(() => {
  jest.clearAllMocks()
  holds(row())
  membersOf.mockImplementation(async (conversationId: number) => [
    member(conversationId, LENA),
    member(conversationId, MAX),
  ])
  pictureInfos.mockResolvedValue([])
  // The write as the query does it: the text, and the database's clock beside it.
  update.mockImplementation(async (_uuid: string, _sender: unknown, body: string) => ({
    success: true,
    value: { ...held, body, editedAt: EDITED_AT },
  }))
  groupUuids.mockImplementation(
    async (ids: number[]) =>
      new Map(ids.filter((id) => id === IN_GROUP).map((id) => [id, GROUP] as const)),
  )
  byUuids.mockImplementation(async (pairs: { communityUuid: string; gradidoId: string }[]) =>
    pairs.map((pair) => ({ id: 1, ...pair, alias: 'lena', deletedAt: null })),
  )
  usersByIds.mockResolvedValue([lenaUser])
})

describe('editChatMessage, what the resolver decides itself (E-060)', () => {
  it("changes the text of the caller's message and hands back their copy, marked as changed", async () => {
    const copy = await edit()

    expect(source).toHaveBeenCalledWith(MESSAGE, { communityUuid: HOME, gradidoId: LENA })
    expect(update).toHaveBeenCalledTimes(1)
    expect(copy).toMatchObject({
      id: 5,
      messageUuid: MESSAGE,
      mine: true,
      body: NEW_TEXT,
      editedAt: EDITED_AT,
      groupUuid: null,
    })
  })

  // ⛔ The check and the write are two statements. The write names the caller -- the pair they
  // are signed in with, not the sender the check read from the row: whatever became of the
  // message in between, only the caller's own is changed. The row here spells the same pair in
  // capitals, so the two can be told apart.
  it('names the caller in the write, by the pair they are signed in with', async () => {
    holds(row({ senderCommunityUuid: HOME.toUpperCase(), senderGradidoId: LENA.toUpperCase() }))

    await edit()

    expect(update).toHaveBeenCalledWith(MESSAGE, { communityUuid: HOME, gradidoId: LENA }, NEW_TEXT)
  })

  it('changes the text of a letter and leaves its subject', async () => {
    holds(row({ subject: 'Flohmarkt' }))

    const copy = await edit()

    expect(copy).toMatchObject({ subject: 'Flohmarkt', body: NEW_TEXT })
    // The write takes a uuid, a pair and a text: there is no subject for it to change.
    expect(update.mock.calls[0]).toHaveLength(3)
  })

  it("changes the caller's message in a group, and hands back who wrote it", async () => {
    holds(row({ conversationId: IN_GROUP, notify: 'email' }))
    membersOf.mockResolvedValue([
      member(IN_GROUP, LENA),
      member(IN_GROUP, MAX),
      member(IN_GROUP, NORA),
    ])

    const copy = await edit()

    expect(copy).toMatchObject({
      body: NEW_TEXT,
      editedAt: EDITED_AT,
      groupUuid: GROUP,
      // An announcement stays one: its mail went out with the words it had.
      announcement: true,
    })
    expect(copy.senderUser?.gradidoID).toBe(LENA)
  })

  describe('the same text again', () => {
    it('writes nothing and marks nothing: the copy comes back as it is', async () => {
      const copy = await edit(TEXT)

      nothingWritten()
      expect(copy).toMatchObject({ messageUuid: MESSAGE, body: TEXT, editedAt: null })
      // Not even who else is in the conversation is looked up.
      expect(membersOf).not.toHaveBeenCalled()
    })

    it('leaves a message changed before with the moment it had', async () => {
      const earlier = new Date('2026-09-30T18:00:00.000Z')
      holds(row({ editedAt: earlier }))

      expect((await edit(TEXT)).editedAt).toEqual(earlier)
      nothingWritten()
    })
  })

  describe('a text emptied', () => {
    it('is refused for a message without a picture', async () => {
      await expect(edit('')).rejects.toThrow('CHAT_MESSAGE_NOT_EDITED: EMPTY')
      expect(pictureInfos).toHaveBeenCalledWith([MESSAGE])
      nothingWritten()
    })

    // E-044: a picture without a caption is a message.
    it('is taken for a message with a picture: the caption goes, the picture stays', async () => {
      pictureInfos.mockResolvedValue([
        { imageUuid: PICTURE, messageUuid: MESSAGE, position: 0, width: 924, height: 520 },
      ])

      const copy = await edit('')

      expect(update).toHaveBeenCalledWith(MESSAGE, { communityUuid: HOME, gradidoId: LENA }, '')
      expect(copy.body).toBe('')
      expect(copy.images).toEqual([{ imageUuid: PICTURE, width: 924, height: 520 }])
    })

    it('asks for the pictures only where the text is emptied', async () => {
      // Once, for the copy handed back (chatMessagesOf) -- not for the check.
      await edit()
      expect(pictureInfos).toHaveBeenCalledTimes(1)
    })
  })

  describe('refuses, before anything is written,', () => {
    it('a message the caller cannot read: none by that uuid, another conversation, a deleted one', async () => {
      source.mockResolvedValue({ success: false, error: new Error('not found') })
      await expect(edit()).rejects.toThrow('CHAT_MESSAGE_NOT_EDITED: UNKNOWN_MESSAGE')
      nothingWritten()
    })

    it("somebody else's message, in a conversation the caller is in", async () => {
      holds(row({ senderGradidoId: MAX }))
      await expect(edit()).rejects.toThrow('CHAT_MESSAGE_NOT_EDITED: NOT_OWN')
      nothingWritten()
    })

    // The same gradido id in another community is another person.
    it('a message of the same gradido id in another community', async () => {
      holds(row({ senderCommunityUuid: ELSEWHERE }))
      await expect(edit()).rejects.toThrow('CHAT_MESSAGE_NOT_EDITED: NOT_OWN')
      nothingWritten()
    })

    // E-059: its words are somebody else's -- or the caller's own, forwarded from elsewhere.
    it('a forwarded copy, whoever wrote its words first', async () => {
      for (const firstWriter of [MAX, LENA]) {
        holds(row({ forwardedFromCommunityUuid: HOME, forwardedFromGradidoId: firstWriter }))
        await expect(edit()).rejects.toThrow('CHAT_MESSAGE_NOT_EDITED: FORWARDED')
      }
      nothingWritten()
    })

    // Their server holds a copy of its own: changed only here, the two would read different words.
    it('a message in a conversation with a member of another community', async () => {
      membersOf.mockResolvedValue([member(WITH_MAX, LENA), member(WITH_MAX, MAX, ELSEWHERE)])
      await expect(edit()).rejects.toThrow('CHAT_MESSAGE_NOT_EDITED: OTHER_COMMUNITY')
      expect(membersOf).toHaveBeenCalledWith(WITH_MAX)
      nothingWritten()
    })

    it('a message that is gone by the time it is written', async () => {
      update.mockResolvedValue({ success: false, error: new Error('not found') })
      await expect(edit()).rejects.toThrow('CHAT_MESSAGE_NOT_EDITED: UNKNOWN_MESSAGE')
    })
  })

  it('takes a community written in capitals for the same one, as the columns compare', async () => {
    membersOf.mockResolvedValue([
      member(WITH_MAX, LENA, HOME.toUpperCase()),
      member(WITH_MAX, MAX, HOME.toUpperCase()),
    ])

    expect((await edit()).body).toBe(NEW_TEXT)
  })

  it('writes the uuid into the log, never a text -- of a change as of a refusal', async () => {
    const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.graphql.resolver.ChatEditResolver`)
    const errors = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.server.LogError`)

    await edit()
    membersOf.mockResolvedValue([member(WITH_MAX, LENA), member(WITH_MAX, MAX, ELSEWHERE)])
    await expect(edit()).rejects.toThrow('OTHER_COMMUNITY')

    const logged = JSON.stringify([
      (logger.info as jest.Mock).mock.calls,
      (errors.error as jest.Mock).mock.calls,
    ])
    expect(logged).toContain(`chat message edited: message_uuid=${MESSAGE}`)
    expect(logged).toContain('CHAT_MESSAGE_NOT_EDITED: OTHER_COMMUNITY')
    expect(logged).not.toContain('Hofflohmarkt')
  })
})
