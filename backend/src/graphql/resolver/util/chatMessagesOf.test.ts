// AI-GENERATED — not an architecture reference
import {
  ChatMessageSelect,
  dbFindUsersByIds,
  dbSelectChatGroupUuids,
  dbSelectChatMessageImageInfos,
  dbSelectChatMessagesByUuids,
  dbSelectUsersByUuids,
} from 'database'
import { chatMessagesOf } from './chatMessagesOf'

// What the database answers is mocked here: the subject is what a page of messages is put
// together from -- here, the quotations over its answers: which message an answer may quote, what
// is read for them, and in how many questions.
jest.mock('database', () => {
  const originalModule = jest.requireActual('database')
  return {
    __esModule: true,
    ...originalModule,
    dbSelectChatMessagesByUuids: jest.fn(),
    dbSelectChatMessageImageInfos: jest.fn(),
    dbSelectChatGroupUuids: jest.fn(),
    dbSelectUsersByUuids: jest.fn(),
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
const DIRECT = 21
const IN_GROUP = 9
// With letters: the answer names its message in the other case than it is filed in.
const QUOTED = 'abcdef00-0000-4000-8000-00000000aa01'
const ANSWER = 'abcdef00-0000-4000-8000-00000000aa02'

const reader = { communityUuid: HOME, gradidoId: LENA }

const row = (rest: Partial<ChatMessageSelect> = {}): ChatMessageSelect => ({
  id: 5,
  messageUuid: QUOTED,
  conversationId: DIRECT,
  senderCommunityUuid: HOME,
  senderGradidoId: MAX,
  subject: null,
  body: 'Wann treffen wir uns?',
  forwardedFromCommunityUuid: null,
  forwardedFromGradidoId: null,
  replyToMessageUuid: null,
  notify: 'none',
  mailState: null,
  deliveryState: 'delivered',
  lastAttemptAt: null,
  delaySeconds: null,
  createdAt: new Date('2026-10-09T08:00:00.000Z'),
  editedAt: null,
  deletedAt: null,
  ...rest,
})
const quoted = (rest: Partial<ChatMessageSelect> = {}) => row(rest)
const answer = (rest: Partial<ChatMessageSelect> = {}) =>
  row({
    id: 6,
    messageUuid: ANSWER,
    senderGradidoId: LENA,
    body: 'Um elf.',
    replyToMessageUuid: QUOTED.toUpperCase(),
    ...rest,
  })

const byUuids = dbSelectChatMessagesByUuids as jest.Mock
const imageInfos = dbSelectChatMessageImageInfos as jest.Mock
const groupUuids = dbSelectChatGroupUuids as jest.Mock
const usersByUuids = dbSelectUsersByUuids as jest.Mock
const usersByIds = dbFindUsersByIds as jest.Mock

const IDS: Record<string, number> = { [LENA]: 1, [MAX]: 2, [NORA]: 3 }
const ALIASES: Record<string, string> = { [LENA]: 'lena', [MAX]: 'max', [NORA]: 'nora' }

beforeEach(() => {
  jest.clearAllMocks()
  byUuids.mockResolvedValue([])
  imageInfos.mockResolvedValue([])
  groupUuids.mockResolvedValue(new Map())
  usersByUuids.mockImplementation(async (pairs: { gradidoId: string }[]) =>
    pairs.map((pair) => ({ id: IDS[pair.gradidoId] })),
  )
  usersByIds.mockImplementation(async (ids: number[]) =>
    Object.entries(IDS)
      .filter(([, id]) => ids.includes(id))
      .map(([gradidoID, id]) => ({
        id,
        communityUuid: HOME,
        gradidoID,
        alias: ALIASES[gradidoID],
        foreign: false,
      })),
  )
})

describe('chatMessagesOf, the quotations over answers', () => {
  // A page without an answer costs no question more than before.
  it('asks for no quoted message where no row answers one', async () => {
    const [message] = await chatMessagesOf([quoted()], reader)

    expect(message.replyTo).toBeNull()
    expect(byUuids).not.toHaveBeenCalled()
  })

  it('quotes the message an answer names, whatever the case it names it in', async () => {
    byUuids.mockResolvedValue([quoted()])

    const [message] = await chatMessagesOf([answer()], reader)

    expect(byUuids).toHaveBeenCalledWith([QUOTED.toUpperCase()])
    expect(message.replyTo).toMatchObject({
      id: 5,
      messageUuid: QUOTED,
      mine: false,
      excerpt: 'Wann treffen wir uns?',
      hasImage: false,
      // Between two members the thread knows both: nobody is looked up.
      senderUser: null,
    })
    expect(usersByUuids).not.toHaveBeenCalled()
  })

  it('says whether the reader wrote the quoted message', async () => {
    byUuids.mockResolvedValue([quoted({ senderGradidoId: LENA })])

    const [message] = await chatMessagesOf([answer()], reader)

    expect(message.replyTo?.mine).toBe(true)
  })

  /**
   * ⛔ The reader reads the conversation of the answer, and nothing says they read another. A
   * row that names a message of another conversation -- however it came to -- quotes nothing.
   */
  it('quotes nothing of a message that lies in another conversation', async () => {
    byUuids.mockResolvedValue([quoted({ conversationId: DIRECT + 1 })])

    const [message] = await chatMessagesOf([answer()], reader)

    expect(message.replyTo).toBeNull()
    expect(JSON.stringify(message)).not.toContain('Wann treffen wir uns?')
  })

  // Marked deleted, or not known here: the query hands back no row, and the answer stands alone.
  it('quotes nothing where the quoted message is not there', async () => {
    byUuids.mockResolvedValue([])

    const [message] = await chatMessagesOf([answer()], reader)

    expect(message.replyTo).toBeNull()
    expect(message.body).toBe('Um elf.')
  })

  // ⛔ One question for the whole page, never one per answer (AGENTS.md, Performance).
  it('reads the quoted messages of a whole page in one question, and their pictures with the page’s', async () => {
    const other = 'abcdef00-0000-4000-8000-00000000aa07'
    byUuids.mockResolvedValue([quoted(), quoted({ id: 4, messageUuid: other, body: '' })])
    imageInfos.mockResolvedValue([
      { imageUuid: 'i', messageUuid: other.toUpperCase(), position: 0, width: 4, height: 3 },
    ])
    const rows = [
      answer({ id: 6 }),
      answer({
        id: 7,
        messageUuid: 'abcdef00-0000-4000-8000-00000000aa03',
        replyToMessageUuid: other,
      }),
      answer({ id: 8, messageUuid: 'abcdef00-0000-4000-8000-00000000aa04' }),
    ]

    const messages = await chatMessagesOf(rows, reader)

    expect(byUuids).toHaveBeenCalledTimes(1)
    expect(imageInfos).toHaveBeenCalledTimes(1)
    expect(imageInfos.mock.calls[0][0]).toEqual(expect.arrayContaining([QUOTED, other, ANSWER]))
    // The picture of the quoted message is named, matched without regard to case -- not shown.
    expect(messages.map((message) => message.replyTo?.hasImage)).toEqual([false, true, false])
    expect(messages[1].replyTo?.excerpt).toBe('')
    // And it is the quoted message's picture, not the answer's.
    expect(messages[1].images).toEqual([])
  })

  it('names who wrote the quoted message in a group, as a group’s message names its writer', async () => {
    groupUuids.mockResolvedValue(new Map([[IN_GROUP, GROUP]]))
    byUuids.mockResolvedValue([quoted({ conversationId: IN_GROUP, senderGradidoId: NORA })])

    const [message] = await chatMessagesOf([answer({ conversationId: IN_GROUP })], reader)

    expect(message.groupUuid).toBe(GROUP)
    expect(message.senderUser?.alias).toBe('lena')
    expect(message.replyTo?.senderUser?.alias).toBe('nora')
    // The writers of the page and of what it quotes, in one go.
    expect(usersByUuids).toHaveBeenCalledTimes(1)
    expect(
      usersByUuids.mock.calls[0][0].map((pair: { gradidoId: string }) => pair.gradidoId),
    ).toEqual(expect.arrayContaining([LENA, NORA]))
  })
})
