// AI-GENERATED — not an architecture reference
import { ChatMessageSelect, DBNotFoundError, dbSelectChatMessageForMember } from 'database'
import { checkedReplyTo } from './chatReply'

// What the database answers is mocked here: the subject is what the check decides -- which
// message a new message may answer.
jest.mock('database', () => {
  const originalModule = jest.requireActual('database')
  return {
    __esModule: true,
    ...originalModule,
    dbSelectChatMessageForMember: jest.fn(),
  }
})

const HOME = '11111111-1111-4111-8111-111111111111'
const LENA = { communityUuid: HOME, gradidoId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' }
// With letters, and filed in lower case: the caller may name it in either.
const ANSWERED = 'abcdef00-0000-4000-8000-00000000aa01'
const CONVERSATION = 21

const forMember = dbSelectChatMessageForMember as jest.Mock
const filedIn = (conversationId: number) =>
  forMember.mockResolvedValue({
    success: true,
    value: { id: 5, messageUuid: ANSWERED, conversationId } as ChatMessageSelect,
  })
const REFUSED = 'CHAT_MESSAGE_NOT_SENT: UNKNOWN_REPLY'

beforeEach(() => jest.clearAllMocks())

describe('checkedReplyTo', () => {
  it('asks nothing where the message answers none', async () => {
    for (const none of [null, undefined, '']) {
      expect(await checkedReplyTo(none, LENA, CONVERSATION)).toBeNull()
    }
    expect(forMember).not.toHaveBeenCalled()
  })

  it('takes a message of the conversation the answer goes into, read as the caller', async () => {
    filedIn(CONVERSATION)

    expect(await checkedReplyTo(ANSWERED, LENA, CONVERSATION)).toBe(ANSWERED)

    expect(forMember).toHaveBeenCalledWith(ANSWERED, LENA)
  })

  // The uuid the answer is filed with is the one the answered message is filed under.
  it('hands back the uuid as it is filed, however the caller spelled it', async () => {
    filedIn(CONVERSATION)

    expect(await checkedReplyTo(ANSWERED.toUpperCase(), LENA, CONVERSATION)).toBe(ANSWERED)
  })

  // ⛔ A message of ANOTHER conversation the caller is in: readable for them, and not to be
  // quoted here -- the others of this conversation may not be in that one.
  it('refuses a message of another conversation, though the caller can read it', async () => {
    filedIn(CONVERSATION + 1)

    await expect(checkedReplyTo(ANSWERED, LENA, CONVERSATION)).rejects.toThrow(REFUSED)
  })

  it('refuses what the caller cannot read: no such message, a deleted one, somebody else’s thread', async () => {
    forMember.mockResolvedValue({
      success: false,
      error: new DBNotFoundError('chat_messages', 'message_uuid for a member'),
    })

    await expect(checkedReplyTo(ANSWERED, LENA, CONVERSATION)).rejects.toThrow(REFUSED)
  })

  // Two members without a conversation have nothing to answer: nothing is even looked up.
  it('refuses an answer where there is no conversation yet, without looking anything up', async () => {
    filedIn(CONVERSATION)

    await expect(checkedReplyTo(ANSWERED, LENA, null)).rejects.toThrow(REFUSED)

    expect(forMember).not.toHaveBeenCalled()
  })

  // Nothing tells the refusals apart: what the caller cannot read, they do not learn about.
  it('answers every refusal alike, and names no message in it', async () => {
    const said: string[] = []
    filedIn(CONVERSATION + 1)
    await checkedReplyTo(ANSWERED, LENA, CONVERSATION).catch((error) => said.push(error.message))
    forMember.mockResolvedValue({ success: false, error: new DBNotFoundError('t', 'w') })
    await checkedReplyTo(ANSWERED, LENA, CONVERSATION).catch((error) => said.push(error.message))
    await checkedReplyTo(ANSWERED, LENA, null).catch((error) => said.push(error.message))

    expect(said).toEqual([REFUSED, REFUSED, REFUSED])
  })
})
