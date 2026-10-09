// AI-GENERATED — not an architecture reference
import { sendChatGroupMessageEmail } from 'core'
import {
  ChatConversationMemberRole,
  ChatConversationMemberSelect,
  ChatConversationSelect,
  ChatMessageSelect,
  User as DbUser,
  dbFindChatGroupByUuid,
  dbFindUsersByIds,
  dbFindUsersWithEmailContactByIds,
  dbInsertChatMessage,
  dbSelectChatConversationMember,
  dbSelectChatConversationMembers,
  dbSelectChatMessageForMember,
  dbSelectChatMessagesByUuids,
  dbSelectUsersByUuids,
} from 'database'
import { Context, newRequestBudget } from '@/server/context'
import { ChatGroupResolver } from './ChatGroupResolver'

// What the database answers is mocked here: the subject is what the resolver decides itself when
// a member writes to a group -- who may announce (E-050 F5), that a refusal files nothing, and
// that the sender does not wait for the mails. ChatGroupResolver.test.ts runs the same ways
// against a database.
jest.mock('core', () => {
  const originalModule = jest.requireActual('core')
  return {
    __esModule: true,
    ...originalModule,
    sendChatGroupMessageEmail: jest.fn(),
  }
})
jest.mock('database', () => {
  const originalModule = jest.requireActual('database')
  return {
    __esModule: true,
    ...originalModule,
    dbFindChatGroupByUuid: jest.fn(),
    dbSelectChatConversationMember: jest.fn(),
    dbSelectChatConversationMembers: jest.fn(),
    dbSelectUsersByUuids: jest.fn(),
    dbFindUsersWithEmailContactByIds: jest.fn(),
    dbInsertChatMessage: jest.fn(),
    dbSelectChatMessageForMember: jest.fn(),
    dbSelectChatMessagesByUuids: jest.fn(async () => []),
    dbSelectChatMessageImageInfos: jest.fn(async () => []),
    dbSelectChatGroupUuids: jest.fn(async () => new Map([[9, GROUP]])),
    dbFindUsersByIds: jest.fn(),
    dbFindMemberAvatarTimestamps: jest.fn(async () => new Map()),
    getHomeCommunity: jest.fn(async () => ({ communityUuid: HOME, name: 'Gradido Akademie' })),
  }
})

const HOME = '11111111-1111-4111-8111-111111111111'
const LENA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const MAX = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const NORA = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
const GROUP = '30000000-0000-4000-8000-000000000009'
const TEXT = 'Treffen am Samstag um 14 Uhr'

const lena = {
  id: 1,
  communityUuid: HOME,
  gradidoID: LENA,
  alias: 'lena',
  firstName: 'Lena',
  lastName: 'Near',
  foreign: false,
} as unknown as DbUser

/** A request of Lena's, with a budget of its own. */
const lenasRequest = (): Context => ({
  token: null,
  setHeaders: [],
  requestBudget: newRequestBudget(),
  user: lena,
})

const group = {
  id: 9,
  conversationUuid: GROUP,
  kind: 'group',
  homeCommunityUuid: HOME,
  directPairKey: null,
  title: 'Chor',
  createdByCommunityUuid: HOME,
  createdByGradidoId: MAX,
  createdAt: new Date('2026-09-29T08:00:00.000Z'),
} as ChatConversationSelect

const memberRow = (
  gradidoId: string,
  role: ChatConversationMemberRole,
  mutedAt: Date | null = null,
): ChatConversationMemberSelect => ({
  conversationId: group.id,
  communityUuid: HOME,
  gradidoId,
  role,
  joinedAt: new Date('2026-09-29T08:00:00.000Z'),
  lastReadMessageId: null,
  mutedAt,
})

const findGroup = dbFindChatGroupByUuid as jest.Mock
const myRow = dbSelectChatConversationMember as jest.Mock
const allRows = dbSelectChatConversationMembers as jest.Mock
const byUuids = dbSelectUsersByUuids as jest.Mock
const withEmail = dbFindUsersWithEmailContactByIds as jest.Mock
const insert = dbInsertChatMessage as jest.Mock
const usersByIds = dbFindUsersByIds as jest.Mock
const mail = sendChatGroupMessageEmail as jest.Mock

const forMember = dbSelectChatMessageForMember as jest.Mock
const quotedRows = dbSelectChatMessagesByUuids as jest.Mock

const write = (announce: boolean, groupUuid = GROUP, replyTo: string | null = null) =>
  new ChatGroupResolver().sendChatGroupMessage(
    { groupUuid, body: TEXT, announce, image: null, replyTo },
    lenasRequest(),
  )

/** Waits for what the request does not wait for: the mails. */
const mailsSent = () => new Promise((resolve) => setTimeout(resolve, 0))

beforeEach(() => {
  jest.clearAllMocks()
  findGroup.mockResolvedValue(group)
  myRow.mockResolvedValue(memberRow(LENA, 'moderator'))
  allRows.mockResolvedValue([
    memberRow(MAX, 'owner'),
    memberRow(LENA, 'moderator'),
    memberRow(NORA, 'member'),
  ])
  byUuids.mockImplementation(async (pairs: { communityUuid: string; gradidoId: string }[]) =>
    pairs.map((pair, index) => ({
      id: 10 + index,
      communityUuid: pair.communityUuid,
      gradidoId: pair.gradidoId,
      alias: null,
      deletedAt: null,
    })),
  )
  withEmail.mockImplementation(async (ids: number[]) =>
    ids.map((id) => ({
      id,
      communityUuid: HOME,
      gradidoID: `id-${id}`,
      firstName: `F${id}`,
      lastName: 'Near',
      language: 'de',
      foreign: false,
      emailContact: { email: `member${id}@example.org` },
    })),
  )
  insert.mockImplementation(async (row) => ({
    success: true,
    value: {
      id: 70,
      mailState: null,
      lastAttemptAt: null,
      delaySeconds: null,
      createdAt: new Date('2026-09-29T08:05:00.000Z'),
      deletedAt: null,
      ...row,
    } as ChatMessageSelect,
  }))
  usersByIds.mockResolvedValue([lena])
  mail.mockResolvedValue({ accepted: ['watched'] })
})

describe('sendChatGroupMessage, what the resolver decides itself', () => {
  it('files a message of every member, and mails nobody where it is no announcement', async () => {
    myRow.mockResolvedValue(memberRow(LENA, 'member'))
    const copy = await write(false)
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ conversationId: group.id, body: TEXT, notify: 'none' }),
    )
    expect(copy).toMatchObject({
      mine: true,
      groupUuid: GROUP,
      notify: 'none',
      mailState: null,
      announcement: false,
    })
    expect(copy.senderUser?.gradidoID).toBe(LENA)
    await mailsSent()
    expect(allRows).not.toHaveBeenCalled()
    expect(mail).not.toHaveBeenCalled()
  })

  // E-050 F5: an announcement reaches up to 99 people by mail.
  it('refuses an announcement from a plain member, and files nothing', async () => {
    myRow.mockResolvedValue(memberRow(LENA, 'member'))
    await expect(write(true)).rejects.toThrow('CHAT_MESSAGE_NOT_SENT: NOT_ALLOWED')
    expect(insert).not.toHaveBeenCalled()
    await mailsSent()
    expect(mail).not.toHaveBeenCalled()
  })

  it('mails an announcement of a moderator to every other member who has not muted the group', async () => {
    allRows.mockResolvedValue([
      memberRow(MAX, 'owner'),
      memberRow(LENA, 'moderator'),
      memberRow(NORA, 'member', new Date('2026-09-29T09:00:00.000Z')),
    ])
    const copy = await write(true)
    expect(byUuids).toHaveBeenCalledWith([expect.objectContaining({ gradidoId: MAX })])
    await mailsSent()
    expect(mail).toHaveBeenCalledTimes(1)
    expect(mail.mock.calls[0][0]).toMatchObject({
      senderAlias: 'lena',
      groupUuid: GROUP,
      memo: TEXT,
      hasImage: false,
    })
    // The copy says what was asked for, never who got a mail (E-024).
    expect(copy).toMatchObject({ notify: 'email', mailState: null, announcement: true })
  })

  it("mails an announcement of the group's owner as well", async () => {
    myRow.mockResolvedValue(memberRow(LENA, 'owner'))
    await write(true)
    await mailsSent()
    expect(mail).toHaveBeenCalledTimes(2)
  })

  // ⛔ Up to 99 mails: the message is sent once it is filed (build plan 4.4).
  it('hands back the copy without waiting for the mails', async () => {
    mail.mockImplementation(() => new Promise(() => undefined))
    await expect(write(true)).resolves.toMatchObject({ body: TEXT })
    expect(mail).toHaveBeenCalledTimes(1)
  })

  it('reads who gets the announcement before the message is filed', async () => {
    const steps: string[] = []
    allRows.mockImplementation(async () => {
      steps.push('recipients')
      return [memberRow(LENA, 'moderator'), memberRow(NORA, 'member')]
    })
    insert.mockImplementation(async (row) => {
      steps.push('message')
      return { success: true, value: { id: 70, createdAt: new Date(), ...row } }
    })
    await write(true)
    expect(steps).toEqual(['recipients', 'message'])
  })

  it('mails nobody where the message could not be filed', async () => {
    insert.mockResolvedValue({ success: false, error: new Error('DBInsertFailed') })
    await expect(write(true)).rejects.toThrow('CHAT_MESSAGE_NOT_SENT: NOT_STORED')
    await mailsSent()
    expect(mail).not.toHaveBeenCalled()
  })

  // Who is not a member learns nothing about a group, not even that it exists.
  it('answers CHAT_GROUP_NOT_FOUND alike to a group the caller is not in and to none', async () => {
    myRow.mockResolvedValue(null)
    await expect(write(false)).rejects.toThrow('CHAT_GROUP_NOT_FOUND')
    findGroup.mockResolvedValue(null)
    await expect(write(false)).rejects.toThrow('CHAT_GROUP_NOT_FOUND')
    expect(insert).not.toHaveBeenCalled()
  })
})

/** An answer to a message of the group (Bernd, 09.10.2026): checked before anything is filed. */
describe('sendChatGroupMessage, answering a message', () => {
  const ANSWERED = 'abcdef00-0000-4000-8000-00000000aa01'
  const answeredRow = (conversationId: number) =>
    ({
      id: 60,
      messageUuid: ANSWERED,
      conversationId,
      senderCommunityUuid: HOME,
      senderGradidoId: MAX,
      body: 'Wer bringt Kuchen mit?',
      replyToMessageUuid: null,
      forwardedFromCommunityUuid: null,
      forwardedFromGradidoId: null,
      deletedAt: null,
    }) as ChatMessageSelect

  beforeEach(() => {
    myRow.mockResolvedValue(memberRow(LENA, 'member'))
  })

  it('files the answer with the uuid of the message it answers, as that one is filed', async () => {
    forMember.mockResolvedValue({ success: true, value: answeredRow(group.id) })
    quotedRows.mockResolvedValue([answeredRow(group.id)])

    const copy = await write(false, GROUP, ANSWERED.toUpperCase())

    expect(forMember).toHaveBeenCalledWith(
      ANSWERED.toUpperCase(),
      expect.objectContaining({ communityUuid: HOME, gradidoId: LENA }),
    )
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ conversationId: group.id, replyToMessageUuid: ANSWERED }),
    )
    expect(copy.replyTo).toMatchObject({
      id: 60,
      messageUuid: ANSWERED,
      mine: false,
      excerpt: 'Wer bringt Kuchen mit?',
    })
  })

  // Gegenprobe: a message that answers none is filed with none, and nothing is looked up for it.
  it('files every other message without one', async () => {
    await write(false)

    expect(forMember).not.toHaveBeenCalled()
    expect(insert.mock.calls[0][0].replyToMessageUuid).toBeNull()
  })

  // ⛔ A message the member can read in ANOTHER conversation is not quoted into this group.
  it('refuses a message of another conversation, filing nothing', async () => {
    forMember.mockResolvedValue({ success: true, value: answeredRow(group.id + 1) })

    await expect(write(false, GROUP, ANSWERED)).rejects.toThrow(
      'CHAT_MESSAGE_NOT_SENT: UNKNOWN_REPLY',
    )
    expect(insert).not.toHaveBeenCalled()
  })

  it('refuses a message the member cannot read, filing nothing and mailing nobody', async () => {
    myRow.mockResolvedValue(memberRow(LENA, 'moderator'))
    forMember.mockResolvedValue({ success: false, error: new Error('DB_NOT_FOUND') })

    await expect(write(true, GROUP, ANSWERED)).rejects.toThrow(
      'CHAT_MESSAGE_NOT_SENT: UNKNOWN_REPLY',
    )
    expect(insert).not.toHaveBeenCalled()
    await mailsSent()
    expect(mail).not.toHaveBeenCalled()
  })

  // Who is not in the group learns nothing about a message either: the group's answer comes first.
  it('answers CHAT_GROUP_NOT_FOUND before it looks at the message', async () => {
    myRow.mockResolvedValue(null)

    await expect(write(false, GROUP, ANSWERED)).rejects.toThrow('CHAT_GROUP_NOT_FOUND')
    expect(forMember).not.toHaveBeenCalled()
  })
})
