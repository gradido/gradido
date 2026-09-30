// AI-GENERATED — not an architecture reference
import { getLogger } from 'config-schema/test/testSetup'
import {
  removeChatMessageImages,
  sendChatGroupAddedEmail,
  sendChatGroupMessageEmail,
  storeChatMessageImages,
} from 'core'
import {
  ChatConversationMemberSelect,
  ChatConversationSelect,
  ChatMessageSelect,
  User as DbUser,
  dbFindUsersWithEmailContactByIds,
  dbInsertChatMessage,
  dbSelectChatConversationMembers,
  dbSelectUsersByUuids,
} from 'database'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import {
  chatGroupAnnouncementRecipients,
  mailableChatMembers,
  mailChatGroupAdded,
  mailChatGroupAnnouncement,
  storeChatGroupMessage,
} from './chatGroupDelivery'

// What the database and the mail would do is mocked here: the subject is what the helper decides
// itself -- the order of pictures and message, who is mailed and who is not, and that one failed
// mail does not stop the next. ChatGroupResolver.test.ts runs the same ways against a database.
jest.mock('core', () => {
  const originalModule = jest.requireActual('core')
  return {
    __esModule: true,
    ...originalModule,
    storeChatMessageImages: jest.fn(),
    removeChatMessageImages: jest.fn(),
    sendChatGroupAddedEmail: jest.fn(),
    sendChatGroupMessageEmail: jest.fn(),
  }
})
jest.mock('database', () => {
  const originalModule = jest.requireActual('database')
  return {
    __esModule: true,
    ...originalModule,
    dbInsertChatMessage: jest.fn(),
    dbSelectUsersByUuids: jest.fn(),
    dbFindUsersWithEmailContactByIds: jest.fn(),
    dbSelectChatConversationMembers: jest.fn(),
  }
})

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.graphql.resolver.util.chatGroupDelivery`)

const HOME = '11111111-1111-4111-8111-111111111111'
const ANNA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const BEN = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const CARLA = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
const TITLE = 'Selbsthilfe Amstetten'
const TEXT = 'Treffen am Samstag um 14 Uhr'

const group = {
  id: 9,
  conversationUuid: '30000000-0000-4000-8000-000000000009',
  kind: 'group',
  homeCommunityUuid: HOME,
  directPairKey: null,
  title: TITLE,
  createdByCommunityUuid: HOME,
  createdByGradidoId: ANNA,
  createdAt: new Date('2026-09-29T08:00:00.000Z'),
} as ChatConversationSelect

const user = (id: number, gradidoID: string, alias: string, extra: Partial<DbUser> = {}) =>
  ({
    id,
    communityUuid: HOME,
    gradidoID,
    alias,
    firstName: alias,
    lastName: 'Near',
    language: 'de',
    foreign: false,
    emailContact: { email: `${alias}@example.org` },
    ...extra,
  }) as unknown as DbUser
const anna = user(1, ANNA, 'anna')
const ben = user(2, BEN, 'ben')
const carla = user(3, CARLA, 'carla', { language: 'en' })

const memberRow = (
  gradidoId: string,
  mutedAt: Date | null = null,
): ChatConversationMemberSelect => ({
  conversationId: group.id,
  communityUuid: HOME,
  gradidoId,
  role: 'member',
  joinedAt: new Date('2026-09-29T08:00:00.000Z'),
  lastReadMessageId: null,
  mutedAt,
})

const stored = (): ChatMessageSelect => ({
  id: 70,
  messageUuid: '10000000-0000-4000-8000-000000000070',
  conversationId: group.id,
  senderCommunityUuid: HOME,
  senderGradidoId: ANNA,
  subject: null,
  body: TEXT,
  notify: 'email',
  mailState: null,
  deliveryState: 'delivered',
  lastAttemptAt: null,
  delaySeconds: null,
  forwardedFromCommunityUuid: null,
  forwardedFromGradidoId: null,
  createdAt: new Date('2026-09-29T08:05:00.000Z'),
  deletedAt: null,
})

const picture = { image: Buffer.from('jpeg'), width: 800, height: 600 }

const storePictures = storeChatMessageImages as jest.Mock
const removePictures = removeChatMessageImages as jest.Mock
const insert = dbInsertChatMessage as jest.Mock
const byUuids = dbSelectUsersByUuids as jest.Mock
const withEmail = dbFindUsersWithEmailContactByIds as jest.Mock
const members = dbSelectChatConversationMembers as jest.Mock
const addedMail = sendChatGroupAddedEmail as jest.Mock
const announcementMail = sendChatGroupMessageEmail as jest.Mock

/** What the transport reports for a mail that went out. */
const SENT = { accepted: ['watched'] }

/** Everything the helper's logger was handed, as one text. */
const logged = (): string =>
  [
    ...(logger.info as jest.Mock).mock.calls,
    ...(logger.error as jest.Mock).mock.calls,
    ...(logger.debug as jest.Mock).mock.calls,
    ...(logger.warn as jest.Mock).mock.calls,
  ]
    .flat()
    .map(String)
    .join('\n')

beforeEach(() => {
  jest.clearAllMocks()
  storePictures.mockResolvedValue(true)
  removePictures.mockResolvedValue(undefined)
  insert.mockImplementation(async (row) => ({ success: true, value: { ...stored(), ...row } }))
  addedMail.mockResolvedValue(SENT)
  announcementMail.mockResolvedValue(SENT)
})

describe('storeChatGroupMessage', () => {
  const store = (announce: boolean, images = [picture]) =>
    storeChatGroupMessage({
      group,
      sender: { communityUuid: HOME, gradidoId: ANNA },
      body: TEXT,
      announce,
      images,
    })

  it('files the pictures first, under the uuid the message is filed under', async () => {
    const steps: string[] = []
    storePictures.mockImplementation(async () => {
      steps.push('pictures')
      return true
    })
    insert.mockImplementation(async (row) => {
      steps.push('message')
      return { success: true, value: { ...stored(), ...row } }
    })

    const row = await store(false)

    expect(steps).toEqual(['pictures', 'message'])
    expect(storePictures.mock.calls[0][0]).toBe(row?.messageUuid)
    expect(storePictures.mock.calls[0][1]).toEqual([
      expect.objectContaining({ width: 800, height: 600, position: 0 }),
    ])
  })

  it('files the message in the group, from the sender, delivered, without a subject', async () => {
    await store(false, [])
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        conversationId: group.id,
        senderCommunityUuid: HOME,
        senderGradidoId: ANNA,
        subject: null,
        body: TEXT,
        deliveryState: 'delivered',
      }),
    )
    expect(storePictures).not.toHaveBeenCalled()
  })

  // The wish, and never what became of it: mail_state fits one recipient only.
  it("files an announcement's wish as 'email', any other message's as 'none', and no mail state", async () => {
    await store(true, [])
    await store(false, [])
    expect(insert.mock.calls.map(([row]) => row.notify)).toEqual(['email', 'none'])
    expect(insert.mock.calls.every(([row]) => row.mailState === undefined)).toBe(true)
  })

  it('files nothing where the pictures could not be filed', async () => {
    storePictures.mockResolvedValue(false)
    expect(await store(false)).toBeNull()
    expect(insert).not.toHaveBeenCalled()
  })

  it('takes the pictures back out where the message was refused', async () => {
    insert.mockResolvedValue({ success: false, error: new Error('DBInsertFailed') })
    expect(await store(false)).toBeNull()
    expect(removePictures).toHaveBeenCalledWith(storePictures.mock.calls[0][0])
  })

  // ⛔ A failed Drizzle query carries its parameters in its message -- the text.
  it('takes them back out where the database threw, and logs no text of it', async () => {
    const failure = Object.assign(new Error(`Failed query: insert ... params: ${TEXT}`), {
      code: 'ER_LOCK_DEADLOCK',
    })
    insert.mockRejectedValue(failure)
    expect(await store(false)).toBeNull()
    expect(removePictures).toHaveBeenCalledTimes(1)
    expect(logged()).toContain('ER_LOCK_DEADLOCK')
    expect(logged()).not.toContain('Samstag')
  })

  it('takes nothing back out for a message without pictures', async () => {
    insert.mockResolvedValue({ success: false, error: new Error('DBInsertFailed') })
    expect(await store(false, [])).toBeNull()
    expect(removePictures).not.toHaveBeenCalled()
  })
})

describe('mailableChatMembers', () => {
  const pairs = [
    { communityUuid: HOME, gradidoId: BEN },
    { communityUuid: HOME, gradidoId: CARLA },
  ]

  it('mails members with an address whose accounts are not deleted', async () => {
    byUuids.mockResolvedValue([
      { id: 2, communityUuid: HOME, gradidoId: BEN, alias: 'ben', deletedAt: null },
      {
        id: 3,
        communityUuid: HOME,
        gradidoId: CARLA,
        alias: 'carla',
        deletedAt: new Date('2026-09-01T00:00:00.000Z'),
      },
    ])
    withEmail.mockResolvedValue([ben])
    expect(await mailableChatMembers(pairs)).toEqual([ben])
    // The deleted account is not even asked for its address.
    expect(withEmail).toHaveBeenCalledWith([2])
  })

  it('mails nobody without an address, and nobody of another community', async () => {
    byUuids.mockResolvedValue([
      { id: 2, communityUuid: HOME, gradidoId: BEN, alias: 'ben', deletedAt: null },
      { id: 3, communityUuid: HOME, gradidoId: CARLA, alias: 'carla', deletedAt: null },
    ])
    withEmail.mockResolvedValue([
      user(2, BEN, 'ben', { emailContact: null } as unknown as Partial<DbUser>),
      user(3, CARLA, 'carla', { foreign: true }),
    ])
    expect(await mailableChatMembers(pairs)).toEqual([])
  })

  it('asks for no address where nobody is left', async () => {
    byUuids.mockResolvedValue([])
    expect(await mailableChatMembers(pairs)).toEqual([])
    expect(withEmail).not.toHaveBeenCalled()
  })
})

describe('chatGroupAnnouncementRecipients', () => {
  beforeEach(() => {
    byUuids.mockImplementation(async (pairs: { gradidoId: string }[]) =>
      pairs.map((pair, index) => ({
        id: 100 + index,
        communityUuid: HOME,
        gradidoId: pair.gradidoId,
        alias: null,
        deletedAt: null,
      })),
    )
    withEmail.mockResolvedValue([])
  })

  const askedFor = (): string[] => byUuids.mock.calls[0][0].map((pair: any) => pair.gradidoId)

  it('goes to every member but the sender', async () => {
    members.mockResolvedValue([memberRow(ANNA), memberRow(BEN), memberRow(CARLA)])
    await chatGroupAnnouncementRecipients(group, { communityUuid: HOME, gradidoId: ANNA })
    expect(askedFor()).toEqual([BEN, CARLA])
  })

  it('leaves out who muted the group', async () => {
    members.mockResolvedValue([
      memberRow(ANNA),
      memberRow(BEN, new Date('2026-09-29T09:00:00.000Z')),
      memberRow(CARLA),
    ])
    await chatGroupAnnouncementRecipients(group, { communityUuid: HOME, gradidoId: ANNA })
    expect(askedFor()).toEqual([CARLA])
  })

  it('knows the sender named in capitals as the sender', async () => {
    members.mockResolvedValue([memberRow(ANNA), memberRow(BEN)])
    await chatGroupAnnouncementRecipients(group, {
      communityUuid: HOME.toUpperCase(),
      gradidoId: ANNA.toUpperCase(),
    })
    expect(askedFor()).toEqual([BEN])
  })
})

describe('the mails of a group', () => {
  it('sends "you are in the group now" to each member taken in, one after the other', async () => {
    const order: string[] = []
    addedMail.mockImplementation(async (data) => {
      order.push(data.email)
      return SENT
    })
    await mailChatGroupAdded({ group, adder: anna, added: [ben, carla], memberCount: 3 })
    expect(order).toEqual(['ben@example.org', 'carla@example.org'])
    expect(addedMail).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: 'ben',
        lastName: 'Near',
        email: 'ben@example.org',
        language: 'de',
        adderAlias: 'anna',
        groupTitle: TITLE,
        groupUuid: group.conversationUuid,
        memberCount: 3,
      }),
    )
    expect(addedMail.mock.calls[1][0]).toMatchObject({ language: 'en' })
  })

  it('sends an announcement to each recipient, with the text and whether there is a picture', async () => {
    await mailChatGroupAnnouncement({
      group,
      senderUser: anna,
      recipients: [ben, carla],
      body: TEXT,
      hasImage: true,
    })
    expect(announcementMail).toHaveBeenCalledTimes(2)
    expect(announcementMail.mock.calls[0][0]).toMatchObject({
      email: 'ben@example.org',
      senderAlias: 'anna',
      groupTitle: TITLE,
      groupUuid: group.conversationUuid,
      memo: TEXT,
      hasImage: true,
    })
  })

  it('goes on to the next recipient where a mail failed or threw', async () => {
    announcementMail
      .mockResolvedValueOnce(new Error('550 mailbox unavailable'))
      .mockRejectedValueOnce(new Error('connection lost'))
      .mockResolvedValueOnce(SENT)
    const dora = user(4, 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'dora')
    await expect(
      mailChatGroupAnnouncement({
        group,
        senderUser: anna,
        recipients: [ben, carla, dora],
        body: TEXT,
        hasImage: false,
      }),
    ).resolves.toBeUndefined()
    expect(announcementMail.mock.calls.map(([data]) => data.email)).toEqual([
      'ben@example.org',
      'carla@example.org',
      'dora@example.org',
    ])
    expect(logged()).toContain(`announcement group=${group.conversationUuid} sent=1 of 3`)
  })

  it("logs neither the group's name nor the text", async () => {
    announcementMail.mockRejectedValueOnce(new Error(`could not send ${TEXT}`))
    await mailChatGroupAnnouncement({
      group,
      senderUser: anna,
      recipients: [ben],
      body: TEXT,
      hasImage: false,
    })
    await mailChatGroupAdded({ group, adder: anna, added: [ben], memberCount: 2 })
    expect(logged()).not.toContain('Amstetten')
    expect(logged()).not.toContain('Samstag')
    expect(logged()).toContain(`added group=${group.conversationUuid} sent=1 of 1`)
  })

  it('sends nothing to nobody', async () => {
    await mailChatGroupAdded({ group, adder: anna, added: [], memberCount: 1 })
    expect(addedMail).not.toHaveBeenCalled()
  })
})
