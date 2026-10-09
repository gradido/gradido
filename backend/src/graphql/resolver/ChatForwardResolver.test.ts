// AI-GENERATED — not an architecture reference

import { getLogger } from 'config-schema/test/testSetup'
import {
  readChatMemberMutedAt,
  recordChatMessageMailState,
  sendCustomEmail,
  storeChatMessage,
  storeChatMessageImages,
} from 'core'
import {
  ChatConversationMemberSelect,
  ChatConversationSelect,
  ChatMessageSelect,
  User as DbUser,
  dbFindChatGroupByUuid,
  dbFindDirectChatConversation,
  dbFindUsersByIds,
  dbInsertChatMessage,
  dbSelectChatConversationMember,
  dbSelectChatGroupUuids,
  dbSelectChatMessageForMember,
  dbSelectChatMessageImageForMember,
  dbSelectChatMessageImageInfos,
  dbSelectUsersByUuids,
  findUserByUuids,
} from 'database'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { Context, newRequestBudget } from '@/server/context'
import { ChatForwardResolver } from './ChatForwardResolver'

// What the database answers is mocked here: the subject is what the resolver decides itself when
// a member forwards a message (E-059) -- what may be forwarded and where to, that every refusal
// comes before anything is filed, who is named as the first writer, and what the mail carries.
jest.mock('core', () => {
  const originalModule = jest.requireActual('core')
  return {
    __esModule: true,
    ...originalModule,
    storeChatMessage: jest.fn(),
    readChatMemberMutedAt: jest.fn(),
    recordChatMessageMailState: jest.fn(),
    sendCustomEmail: jest.fn(),
    storeChatMessageImages: jest.fn(),
    removeChatMessageImages: jest.fn(),
  }
})
jest.mock('database', () => {
  const originalModule = jest.requireActual('database')
  return {
    __esModule: true,
    ...originalModule,
    dbSelectChatMessageForMember: jest.fn(),
    dbFindChatGroupByUuid: jest.fn(),
    dbSelectChatConversationMember: jest.fn(),
    findUserByUuids: jest.fn(),
    dbFindDirectChatConversation: jest.fn(),
    dbSelectChatMessageImageInfos: jest.fn(),
    dbSelectChatMessageImageForMember: jest.fn(),
    dbSelectUsersByUuids: jest.fn(),
    dbInsertChatMessage: jest.fn(),
    dbSelectChatGroupUuids: jest.fn(),
    dbFindUsersByIds: jest.fn(),
    dbFindMemberAvatarTimestamps: jest.fn(async () => new Map()),
    getHomeCommunity: jest.fn(async () => ({ communityUuid: HOME, name: 'Gradido Akademie' })),
  }
})
jest.mock('./util/communities', () => ({
  __esModule: true,
  resolveCommunityUuid: jest.fn(async (communityUuid: string | null) => communityUuid ?? HOME),
  isHomeCommunity: jest.fn(async (communityUuid: string) => communityUuid.toLowerCase() === HOME),
}))

const HOME = '11111111-1111-4111-8111-111111111111'
const ELSEWHERE = '22222222-2222-4222-8222-222222222222'
const LENA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const MAX = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const NORA = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
const NIKO = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
const OTTO = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'
const GROUP = '30000000-0000-4000-8000-000000000009'
const OTHER_GROUP = '30000000-0000-4000-8000-000000000010'
const SOURCE = '40000000-0000-4000-8000-000000000001'
const PICTURE = '50000000-0000-4000-8000-000000000001'
const TEXT = 'Der Hofflohmarkt ist am Sonntag ab 11 Uhr.'
const WORDS = 'Wer kommt mit?'

const ALIASES: Record<string, string> = {
  [LENA]: 'lena',
  [MAX]: 'max',
  [NORA]: 'nora',
  [NIKO]: 'niko',
  [OTTO]: 'otto',
}
const IDS: Record<string, number> = { [LENA]: 1, [MAX]: 2, [NORA]: 3, [NIKO]: 4, [OTTO]: 5 }

const user = (gradidoID: string): DbUser =>
  ({
    id: IDS[gradidoID],
    communityUuid: HOME,
    gradidoID,
    alias: ALIASES[gradidoID],
    firstName: ALIASES[gradidoID],
    lastName: 'Near',
    language: 'de',
    foreign: false,
    emailContact: { email: `${ALIASES[gradidoID]}@example.org` },
  }) as unknown as DbUser

/** A request of Lena's, with a budget of its own. */
const lenasRequest = (): Context => ({
  token: null,
  setHeaders: [],
  requestBudget: newRequestBudget(),
  user: user(LENA),
})

const group = {
  id: 9,
  conversationUuid: GROUP,
  kind: 'group',
  homeCommunityUuid: HOME,
  directPairKey: null,
  title: 'Café',
  createdByCommunityUuid: HOME,
  createdByGradidoId: MAX,
  createdAt: new Date('2026-09-29T08:00:00.000Z'),
} as ChatConversationSelect

const lenasRow = {
  conversationId: group.id,
  communityUuid: HOME,
  gradidoId: LENA,
  role: 'member',
  joinedAt: new Date('2026-09-29T08:00:00.000Z'),
  lastReadMessageId: null,
  mutedAt: null,
} as ChatConversationMemberSelect

const row = (rest: Partial<ChatMessageSelect> = {}): ChatMessageSelect => ({
  id: 5,
  messageUuid: SOURCE,
  conversationId: 21,
  senderCommunityUuid: HOME,
  senderGradidoId: MAX,
  subject: null,
  body: TEXT,
  forwardedFromCommunityUuid: null,
  forwardedFromGradidoId: null,
  replyToMessageUuid: null,
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

const source = dbSelectChatMessageForMember as jest.Mock
const findGroup = dbFindChatGroupByUuid as jest.Mock
const myRow = dbSelectChatConversationMember as jest.Mock
const recipientUser = findUserByUuids as jest.Mock
const pairConversation = dbFindDirectChatConversation as jest.Mock
const pictureInfos = dbSelectChatMessageImageInfos as jest.Mock
const pictureBytes = dbSelectChatMessageImageForMember as jest.Mock
const byUuids = dbSelectUsersByUuids as jest.Mock
const insert = dbInsertChatMessage as jest.Mock
const groupUuids = dbSelectChatGroupUuids as jest.Mock
const usersByIds = dbFindUsersByIds as jest.Mock
const store = storeChatMessage as jest.Mock
const mutedAt = readChatMemberMutedAt as jest.Mock
const mailState = recordChatMessageMailState as jest.Mock
const mail = sendCustomEmail as jest.Mock
const storePictures = storeChatMessageImages as jest.Mock

const forward = (
  rest: Partial<{
    messageUuid: string
    groupUuids: string[]
    members: { gradidoID: string; communityUuid?: string | null }[]
    words: string | null
    alsoByEmail: boolean
  }> = {},
) =>
  new ChatForwardResolver().forwardChatMessage(
    {
      messageUuid: SOURCE,
      groupUuids: [GROUP],
      members: [{ gradidoID: NORA, communityUuid: HOME }],
      words: null,
      alsoByEmail: false,
      ...rest,
    },
    lenasRequest(),
  )

let nextId: number
beforeEach(() => {
  jest.clearAllMocks()
  nextId = 100
  source.mockResolvedValue({ success: true, value: row() })
  findGroup.mockImplementation(async (uuid: string) => (uuid === GROUP ? group : null))
  myRow.mockResolvedValue(lenasRow)
  recipientUser.mockImplementation(async (_community: string, gradidoId: string) =>
    ALIASES[gradidoId] ? user(gradidoId) : null,
  )
  pairConversation.mockResolvedValue({ id: 30 })
  pictureInfos.mockResolvedValue([])
  byUuids.mockImplementation(async (pairs: { communityUuid: string; gradidoId: string }[]) =>
    pairs.map((pair) => ({
      id: IDS[pair.gradidoId],
      communityUuid: pair.communityUuid,
      gradidoId: pair.gradidoId,
      alias: ALIASES[pair.gradidoId],
      deletedAt: null,
    })),
  )
  usersByIds.mockImplementation(async (ids: number[]) =>
    ids.map((id) => user(Object.keys(IDS).find((gradidoId) => IDS[gradidoId] === id) as string)),
  )
  insert.mockImplementation(async (filed) => ({
    success: true,
    value: row({ id: nextId++, ...filed }),
  }))
  store.mockImplementation(async (message) =>
    row({
      id: nextId++,
      messageUuid: message.messageUuid,
      conversationId: 30,
      senderCommunityUuid: message.sender.communityUuid,
      senderGradidoId: message.sender.gradidoId,
      subject: message.subject,
      body: message.body,
      notify: message.notify,
      forwardedFromCommunityUuid: message.forwardedFrom?.communityUuid ?? null,
      forwardedFromGradidoId: message.forwardedFrom?.gradidoId ?? null,
    }),
  )
  groupUuids.mockImplementation(
    async (ids: number[]) => new Map(ids.filter((id) => id === group.id).map((id) => [id, GROUP])),
  )
  mutedAt.mockResolvedValue(null)
  mailState.mockResolvedValue(new Date())
  mail.mockResolvedValue({ accepted: ['nora@example.org'] })
  storePictures.mockResolvedValue(true)
})

describe('forwardChatMessage, what the resolver decides itself (E-059)', () => {
  it('files a copy in the group and one to the member, each naming the first writer', async () => {
    const copies = await forward()

    expect(insert).toHaveBeenCalledTimes(1)
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        conversationId: group.id,
        senderGradidoId: LENA,
        subject: null,
        body: TEXT,
        forwardedFromCommunityUuid: HOME,
        forwardedFromGradidoId: MAX,
        notify: 'none',
      }),
    )
    expect(store).toHaveBeenCalledTimes(1)
    expect(store).toHaveBeenCalledWith(
      expect.objectContaining({
        sender: { communityUuid: HOME, gradidoId: LENA },
        recipient: { communityUuid: HOME, gradidoId: NORA },
        body: TEXT,
        notify: 'none',
        forwardedFrom: { communityUuid: HOME, gradidoId: MAX },
      }),
      'local',
    )
    expect(copies).toHaveLength(2)
    for (const copy of copies) {
      expect(copy).toMatchObject({ mine: true, forwarded: true, body: TEXT })
      expect(copy.forwardedFrom?.gradidoID).toBe(MAX)
    }
    expect(copies[0].groupUuid).toBe(GROUP)
    expect(copies[1].groupUuid).toBeNull()
  })

  it("keeps a letter's subject in the copy", async () => {
    source.mockResolvedValue({ success: true, value: row({ subject: 'Flohmarkt' }) })
    await forward()
    expect(insert.mock.calls[0][0].subject).toBe('Flohmarkt')
    expect(store.mock.calls[0][0].subject).toBe('Flohmarkt')
  })

  // Through several forwardings the first writer stays (E-059).
  it('names the first writer of a copy that is forwarded again, not whoever passed it on', async () => {
    source.mockResolvedValue({
      success: true,
      value: row({ forwardedFromCommunityUuid: HOME, forwardedFromGradidoId: NIKO }),
    })
    const copies = await forward({ alsoByEmail: true })
    expect(insert.mock.calls[0][0].forwardedFromGradidoId).toBe(NIKO)
    expect(store.mock.calls[0][0].forwardedFrom).toEqual({ communityUuid: HOME, gradidoId: NIKO })
    expect(copies.map((copy) => copy.forwardedFrom?.gradidoID)).toEqual([NIKO, NIKO])
    expect(mail).toHaveBeenCalledWith(expect.objectContaining({ forwardedFromAlias: 'niko' }))
  })

  // Words of one's own are forwarded too, and name nobody (E-059).
  it("marks a copy of the caller's own words as forwarded, and names nobody", async () => {
    source.mockResolvedValue({ success: true, value: row({ senderGradidoId: LENA }) })
    const copies = await forward({ alsoByEmail: true })
    expect(insert.mock.calls[0][0].forwardedFromGradidoId).toBe(LENA)
    for (const copy of copies) {
      expect(copy.forwarded).toBe(true)
      expect(copy.forwardedFrom).toBeNull()
    }
    expect(mail).toHaveBeenCalledWith(
      expect.objectContaining({ forwarded: true, forwardedFromAlias: null }),
    )
  })

  it('files the words after every copy, as a message of their own that names nobody', async () => {
    const copies = await forward({ words: WORDS })

    expect(insert).toHaveBeenCalledTimes(2)
    expect(insert.mock.calls[1][0]).toMatchObject({
      conversationId: group.id,
      body: WORDS,
      forwardedFromCommunityUuid: null,
      forwardedFromGradidoId: null,
      replyToMessageUuid: null,
      notify: 'none',
    })
    expect(store).toHaveBeenCalledTimes(2)
    expect(store.mock.calls[1][0]).toMatchObject({
      recipient: { communityUuid: HOME, gradidoId: NORA },
      subject: null,
      body: WORDS,
      notify: 'none',
      forwardedFrom: null,
    })
    // The copies come back, not the words.
    expect(copies.map((copy) => copy.body)).toEqual([TEXT, TEXT])
  })

  it('files no words that are only spaces', async () => {
    await forward({ words: '  \n ' })
    expect(insert).toHaveBeenCalledTimes(1)
    expect(store).toHaveBeenCalledTimes(1)
  })

  // E-024: the first message of a pair goes by mail in any case.
  it('mails the first message of a pair, naming the first writer and carrying the words -- one mail', async () => {
    pairConversation.mockResolvedValue(null)
    await forward({ words: WORDS })

    expect(store.mock.calls[0][0].notify).toBe('email')
    expect(mail).toHaveBeenCalledTimes(1)
    expect(mail).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'nora@example.org',
        senderAlias: expect.any(String),
        memo: TEXT,
        forwarded: true,
        forwardedFromAlias: 'max',
        forwardWords: WORDS,
      }),
    )
  })

  it('mails a later message only where the box is ticked', async () => {
    await forward()
    expect(store.mock.calls[0][0].notify).toBe('none')
    expect(mail).not.toHaveBeenCalled()

    jest.clearAllMocks()
    await forward({ alsoByEmail: true })
    expect(store.mock.calls[0][0].notify).toBe('email')
    expect(mail).toHaveBeenCalledTimes(1)
  })

  it('never announces a copy in a group', async () => {
    await forward({ alsoByEmail: true, members: [] })
    expect(insert.mock.calls[0][0].notify).toBe('none')
    expect(mail).not.toHaveBeenCalled()
  })

  it('files the picture again for every copy, read for the caller', async () => {
    const bytes = Buffer.from('jpeg bytes')
    pictureInfos.mockImplementation(async (uuids: string[]) =>
      uuids.includes(SOURCE)
        ? [{ imageUuid: PICTURE, messageUuid: SOURCE, position: 0, width: 320, height: 240 }]
        : [],
    )
    pictureBytes.mockResolvedValue({ success: true, value: bytes })

    await forward()

    expect(pictureBytes).toHaveBeenCalledWith(PICTURE, { communityUuid: HOME, gradidoId: LENA })
    expect(storePictures).toHaveBeenCalledTimes(2)
    for (const [, pictures] of storePictures.mock.calls) {
      expect(pictures).toEqual([
        expect.objectContaining({ image: bytes, width: 320, height: 240, position: 0 }),
      ])
      expect(pictures[0].imageUuid).not.toBe(PICTURE)
    }
  })

  it('forwards no caption without its picture', async () => {
    pictureInfos.mockResolvedValue([
      { imageUuid: PICTURE, messageUuid: SOURCE, position: 0, width: 320, height: 240 },
    ])
    pictureBytes.mockResolvedValue({ success: false, error: new Error('not found') })
    await expect(forward()).rejects.toThrow('CHAT_MESSAGE_NOT_FORWARDED: UNKNOWN_MESSAGE')
    expect(insert).not.toHaveBeenCalled()
    expect(store).not.toHaveBeenCalled()
  })

  it('counts a group and a member named twice once', async () => {
    const copies = await forward({
      groupUuids: [GROUP, GROUP.toUpperCase()],
      members: [
        { gradidoID: NORA, communityUuid: HOME },
        { gradidoID: NORA, communityUuid: null },
      ],
    })
    expect(copies).toHaveLength(2)
  })

  describe('refuses before anything is filed', () => {
    const nothingFiled = () => {
      expect(insert).not.toHaveBeenCalled()
      expect(store).not.toHaveBeenCalled()
      expect(storePictures).not.toHaveBeenCalled()
      expect(mail).not.toHaveBeenCalled()
    }

    it('without a conversation to forward into', async () => {
      await expect(forward({ groupUuids: [], members: [] })).rejects.toThrow(
        'CHAT_MESSAGE_NOT_FORWARDED: TARGETS',
      )
      nothingFiled()
    })

    // E-059 F3: five at most, groups and members together.
    it('for more than five conversations together', async () => {
      await expect(
        forward({
          groupUuids: [GROUP, OTHER_GROUP],
          members: [NORA, NIKO, OTTO, MAX].map((gradidoID) => ({ gradidoID, communityUuid: HOME })),
        }),
      ).rejects.toThrow('CHAT_MESSAGE_NOT_FORWARDED: TARGETS')
      nothingFiled()
    })

    it('for a message the caller cannot read', async () => {
      source.mockResolvedValue({ success: false, error: new Error('not found') })
      await expect(forward()).rejects.toThrow('CHAT_MESSAGE_NOT_FORWARDED: UNKNOWN_MESSAGE')
      nothingFiled()
    })

    it('for a group the caller is not in, as for none', async () => {
      myRow.mockResolvedValue(null)
      await expect(forward()).rejects.toThrow('CHAT_MESSAGE_NOT_FORWARDED: UNKNOWN_GROUP')
      await expect(forward({ groupUuids: [OTHER_GROUP] })).rejects.toThrow(
        'CHAT_MESSAGE_NOT_FORWARDED: UNKNOWN_GROUP',
      )
      nothingFiled()
    })

    // E-059 F5: across the border with P6.
    it('for a member of another community', async () => {
      await expect(
        forward({ members: [{ gradidoID: NORA, communityUuid: ELSEWHERE }] }),
      ).rejects.toThrow('CHAT_MESSAGE_NOT_FORWARDED: OTHER_COMMUNITY')
      nothingFiled()
    })

    it('for the caller themselves', async () => {
      await expect(
        forward({ members: [{ gradidoID: LENA, communityUuid: HOME }] }),
      ).rejects.toThrow('CHAT_MESSAGE_NOT_FORWARDED: TO_ONESELF')
      nothingFiled()
    })

    it('for a member unknown here', async () => {
      recipientUser.mockResolvedValue(null)
      await expect(forward()).rejects.toThrow('CHAT_MESSAGE_NOT_FORWARDED: UNKNOWN_RECIPIENT')
      nothingFiled()
    })
  })

  // coderabbit, #4028: whatever fails for one member -- here the conversation looked up.
  it('goes on with the members after one whose copy failed, and writes no text into the log', async () => {
    pairConversation.mockImplementation(async (_caller, other) => {
      if (other.gradidoId === NORA) {
        throw new Error("Failed query: select ... params: 'Der Hofflohmarkt'")
      }
      return { id: 30 }
    })
    const copies = await forward({
      members: [
        { gradidoID: NORA, communityUuid: HOME },
        { gradidoID: NIKO, communityUuid: HOME },
      ],
    })
    expect(copies).toHaveLength(2)
    expect(store).toHaveBeenCalledTimes(1)
    expect(store.mock.calls[0][0].recipient.gradidoId).toBe(NIKO)
    const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.graphql.resolver.ChatForwardResolver`)
    const warned = JSON.stringify((logger.warn as jest.Mock).mock.calls)
    expect(warned).toContain(`chat message not forwarded to a member: message_uuid=${SOURCE}`)
    expect(warned).not.toContain('Hofflohmarkt')
  })

  it('goes on with the others where a copy could not be filed, and hands back those that were', async () => {
    insert.mockResolvedValue({ success: false, error: new Error('no') })
    const copies = await forward()
    expect(copies).toHaveLength(1)
    expect(copies[0].groupUuid).toBeNull()
  })

  it('writes the uuid and the count into the log, never a text or a name', async () => {
    const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.graphql.resolver.ChatForwardResolver`)
    await forward({ words: WORDS })
    const logged = JSON.stringify((logger.info as jest.Mock).mock.calls)
    expect(logged).toContain(`message_uuid=${SOURCE} copies=2 of 2`)
    expect(logged).not.toContain(TEXT)
    expect(logged).not.toContain(WORDS)
    expect(logged).not.toContain('max')
  })
})
