// AI-GENERATED — not an architecture reference
import {
  ChatConversationMemberSelect,
  ChatConversationSelect,
  ChatMessageImageInfo,
  ChatMessageSelect,
  DBNotFoundError,
  User as DbUser,
  dbFindDirectChatConversation,
  dbSelectChatConversationMembers,
  dbSelectChatMessageImageForMember,
  dbSelectChatMessageImageInfos,
  dbSelectChatMessagesPage,
} from 'database'
import { CHAT_IMAGES_MAX_PER_REQUEST } from '@/data/ChatConversation.logic'
import { Context, newRequestBudget } from '@/server/context'
import { ChatResolver } from './ChatResolver'

// What the database answers is mocked here: the subject is what the resolver decides itself --
// that a page asks for its pictures once, which picture goes with which message, and when a
// picture is not even asked for. ChatResolver.test.ts runs the same ways against a database.
jest.mock('database', () => {
  const originalModule = jest.requireActual('database')
  return {
    __esModule: true,
    ...originalModule,
    dbFindDirectChatConversation: jest.fn(),
    dbSelectChatConversationMembers: jest.fn(),
    dbSelectChatMessagesPage: jest.fn(),
    dbSelectChatMessageImageInfos: jest.fn(),
    // No group among these conversations: the messages here are between two members (P5 asks
    // for every page and update which of its conversations are groups).
    dbSelectChatGroupUuids: jest.fn(async () => new Map()),
    dbSelectChatMessageImageForMember: jest.fn(),
  }
})

const HOME = '11111111-1111-4111-8111-111111111111'
const LENA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const MAX = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const PICTURE = '40000000-0000-4000-8000-000000000001'

const findConversation = dbFindDirectChatConversation as jest.MockedFunction<
  typeof dbFindDirectChatConversation
>
const members = dbSelectChatConversationMembers as jest.MockedFunction<
  typeof dbSelectChatConversationMembers
>
const page = dbSelectChatMessagesPage as jest.MockedFunction<typeof dbSelectChatMessagesPage>
const infos = dbSelectChatMessageImageInfos as jest.MockedFunction<
  typeof dbSelectChatMessageImageInfos
>
const forMember = dbSelectChatMessageImageForMember as jest.MockedFunction<
  typeof dbSelectChatMessageImageForMember
>

/** A request of Lena's, with a budget of its own. */
const lenasRequest = (): Context => ({
  token: null,
  setHeaders: [],
  requestBudget: newRequestBudget(),
  user: { communityUuid: HOME, gradidoID: LENA } as unknown as DbUser,
})

const uuidOf = (id: number) => `10000000-0000-4000-8000-${String(id).padStart(12, '0')}`

/** A message Max wrote to Lena, filed under this id. */
const fromMax = (id: number): ChatMessageSelect => ({
  id,
  messageUuid: uuidOf(id),
  conversationId: 3,
  senderCommunityUuid: HOME,
  senderGradidoId: MAX,
  subject: null,
  body: 'look',
  notify: 'email',
  mailState: null,
  deliveryState: 'delivered',
  lastAttemptAt: null,
  delaySeconds: null,
  forwardedFromCommunityUuid: null,
  forwardedFromGradidoId: null,
  replyToMessageUuid: null,
  createdAt: new Date('2026-09-27T06:00:00.000Z'),
  editedAt: null,
  reactedAt: null,
  deletedAt: null,
})

const pictureOf = (
  messageUuid: string,
  imageUuid: string,
  position = 0,
  width = 800,
  height = 600,
): ChatMessageImageInfo => ({ imageUuid, messageUuid, position, width, height })

beforeEach(() => {
  jest.clearAllMocks()
  findConversation.mockResolvedValue({ id: 3 } as ChatConversationSelect)
  members.mockResolvedValue([])
  infos.mockResolvedValue([])
})

describe('chatMessagesWithMember, the pictures of a page', () => {
  const ask = () =>
    new ChatResolver().chatMessagesWithMember(
      { ref: { communityUuid: HOME, gradidoID: MAX }, before: null, limit: 50 },
      lenasRequest(),
    )

  it('asks for the pictures of the whole page in one query, and gives each message its own', async () => {
    page.mockResolvedValue({ messages: [fromMax(1), fromMax(2), fromMax(3)], hasMore: false })
    infos.mockResolvedValue([
      pictureOf(uuidOf(1), '40000000-0000-4000-8000-000000000011'),
      pictureOf(uuidOf(3), '40000000-0000-4000-8000-000000000031', 0, 393, 1220),
      pictureOf(uuidOf(3), '40000000-0000-4000-8000-000000000032', 1),
    ])

    const answer = await ask()

    expect(infos.mock.calls).toEqual([[[uuidOf(1), uuidOf(2), uuidOf(3)]]])
    expect(answer.messages.map((message) => message.images)).toEqual([
      [{ imageUuid: '40000000-0000-4000-8000-000000000011', width: 800, height: 600 }],
      [],
      [
        { imageUuid: '40000000-0000-4000-8000-000000000031', width: 393, height: 1220 },
        { imageUuid: '40000000-0000-4000-8000-000000000032', width: 800, height: 600 },
      ],
    ])
  })

  // A uuid is the same message in capitals as in small letters: the column compares so.
  // Both ways: a message filed in small letters with its picture in capitals, and one the other
  // way round. The uuids carry letters, or capitals would change nothing about them.
  it('finds a picture whose message uuid comes back in other letters', async () => {
    const small = 'abcdef00-0000-4000-8000-0000000000aa'
    const capitals = 'ABCDEF00-0000-4000-8000-0000000000BB'
    expect(small.toUpperCase()).not.toBe(small)
    page.mockResolvedValue({
      messages: [
        { ...fromMax(1), messageUuid: small },
        { ...fromMax(2), messageUuid: capitals },
      ],
      hasMore: false,
    })
    infos.mockResolvedValue([
      pictureOf(small.toUpperCase(), '40000000-0000-4000-8000-00000000000a'),
      pictureOf(capitals.toLowerCase(), '40000000-0000-4000-8000-00000000000b'),
    ])

    const answer = await ask()

    expect(answer.messages.map((message) => message.images)).toEqual([
      [{ imageUuid: '40000000-0000-4000-8000-00000000000a', width: 800, height: 600 }],
      [{ imageUuid: '40000000-0000-4000-8000-00000000000b', width: 800, height: 600 }],
    ])
  })
})

/**
 * How far the other member has read (Chat E-093), on the page: from the OTHER member's row, the
 * mute mark from the caller's own (E-024) -- both rows come in the one read, in whatever order.
 */
describe('chatMessagesWithMember, how far the other member has read', () => {
  const OTHER = 'cafecafe-cafe-4afe-8afe-cafecafecafe'
  const ask = (communityUuid = HOME) =>
    new ChatResolver().chatMessagesWithMember(
      { ref: { communityUuid, gradidoID: MAX }, before: null, limit: 50 },
      lenasRequest(),
    )
  const row = (
    gradidoId: string,
    lastReadMessageId: number | null,
    mutedAt: Date | null = null,
    communityUuid = HOME,
  ): ChatConversationMemberSelect => ({
    conversationId: 3,
    communityUuid,
    gradidoId,
    role: 'member',
    joinedAt: new Date('2026-09-27T06:00:00.000Z'),
    lastReadMessageId,
    mutedAt,
  })

  beforeEach(() => {
    page.mockResolvedValue({ messages: [], hasMore: false })
  })

  it("takes the pointer from the other member's row and the mute mark from the caller's", async () => {
    members.mockResolvedValue([row(LENA, 12, new Date()), row(MAX, 17)])
    expect(await ask()).toMatchObject({ partnerReadUpTo: 17, mutedByMe: true })

    members.mockResolvedValue([row(MAX, 17, new Date()), row(LENA, 12)])
    expect(await ask()).toMatchObject({ partnerReadUpTo: 17, mutedByMe: false })
  })

  it('says 0 where the other member has read nothing', async () => {
    members.mockResolvedValue([row(LENA, 12), row(MAX, null)])
    expect((await ask()).partnerReadUpTo).toBe(0)
  })

  it('says null for a member of another community, whatever their row says', async () => {
    members.mockResolvedValue([row(LENA, 12), row(MAX, 17, null, OTHER)])
    expect((await ask(OTHER)).partnerReadUpTo).toBeNull()
  })
})

describe('chatMessageImage', () => {
  const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0xff, 0xd9])

  const askFor = (imageUuid: string, context: Context = lenasRequest()) =>
    new ChatResolver().chatMessageImage(imageUuid, context)

  it('hands the picture to the member asking, as base64', async () => {
    forMember.mockResolvedValue({ success: true, value: JPEG })

    expect(await askFor(PICTURE)).toBe(JPEG.toString('base64'))
    expect(forMember.mock.calls).toEqual([[PICTURE, { communityUuid: HOME, gradidoId: LENA }]])
  })

  // One answer for no such picture, a stranger, a deleted message: the query decides, and the
  // resolver says nothing more.
  it('answers null where the query finds nothing for the member', async () => {
    forMember.mockResolvedValue({
      success: false,
      error: new DBNotFoundError('chat_message_images', 'image_uuid'),
    })

    expect(await askFor(PICTURE)).toBeNull()
  })

  it('answers null to something that is no uuid, without asking the database', async () => {
    expect(await askFor('../../etc/passwd')).toBeNull()
    expect(await askFor('')).toBeNull()
    expect(forMember).not.toHaveBeenCalled()
  })

  // ⛔ Counted before anything is read: a document may repeat the field under any number of
  // aliases, one picture each.
  it('answers ten in one request, and refuses the eleventh before reading it', async () => {
    forMember.mockResolvedValue({ success: true, value: JPEG })
    const oneRequest = lenasRequest()

    for (let n = 0; n < CHAT_IMAGES_MAX_PER_REQUEST; n++) {
      expect(await askFor(PICTURE, oneRequest)).toBe(JPEG.toString('base64'))
    }
    await expect(askFor(PICTURE, oneRequest)).rejects.toThrow(
      'Too many chat pictures requested at once',
    )
    expect(forMember).toHaveBeenCalledTimes(CHAT_IMAGES_MAX_PER_REQUEST)
    // Another request has a budget of its own.
    expect(await askFor(PICTURE)).toBe(JPEG.toString('base64'))
  })

  it('counts what is no uuid as well', async () => {
    const oneRequest = lenasRequest()

    for (let n = 0; n < CHAT_IMAGES_MAX_PER_REQUEST; n++) {
      await askFor('no uuid', oneRequest)
    }
    await expect(askFor(PICTURE, oneRequest)).rejects.toThrow(
      'Too many chat pictures requested at once',
    )
    expect(forMember).not.toHaveBeenCalled()
  })
})
