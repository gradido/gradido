// AI-GENERATED — not an architecture reference
import {
  readChatMemberMutedAt,
  recordChatMessageDelivery,
  sendCustomEmail,
  storeChatMessage,
  V1_0_CommandClient,
} from 'core'
import { ChatMessageSelect, Community as DbCommunity, User as DbUser } from 'database'
import { CommandJwtPayloadType, createKeyPair, verifyAndDecrypt } from 'shared'
import { deliverChatMessageAcrossBorder, deliverChatMessageLocally } from './chatMessageDelivery'

// What the database would do is mocked here: the helper's own decisions are the subject --
// above all the one no database test can bring about, a row that could not be filed.
// ChatResolver.test.ts and TransactionResolver.test.ts run the same ways against a database.
jest.mock('core', () => {
  const originalModule = jest.requireActual('core')
  return {
    __esModule: true,
    ...originalModule,
    storeChatMessage: jest.fn(),
    readChatMemberMutedAt: jest.fn(),
    recordChatMessageDelivery: jest.fn(),
    sendCustomEmail: jest.fn(),
  }
})

const HOME = '11111111-1111-4111-8111-111111111111'
const PEER = '22222222-2222-4222-8222-222222222222'
const ANNA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const BEN = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'

const anna = {
  communityUuid: HOME,
  gradidoID: ANNA,
  alias: 'anna',
  firstName: 'Anna',
  lastName: 'Near',
} as unknown as DbUser
const ben = {
  communityUuid: HOME,
  gradidoID: BEN,
  alias: 'ben',
  firstName: 'Ben',
  lastName: 'Near',
  language: 'de',
  emailContact: { email: 'ben@example.org' },
} as unknown as DbUser

const row = (deliveryState: 'delivered' | 'pending'): ChatMessageSelect => ({
  id: 5,
  messageUuid: '10000000-0000-4000-8000-000000000005',
  conversationId: 3,
  senderCommunityUuid: HOME,
  senderGradidoId: ANNA,
  subject: null,
  body: 'Shall we meet at ten?',
  notify: 'email',
  deliveryState,
  lastAttemptAt: null,
  delaySeconds: null,
  createdAt: new Date('2026-09-24T12:00:00.000Z'),
  deletedAt: null,
})

const store = storeChatMessage as jest.Mock
const mutedAt = readChatMemberMutedAt as jest.Mock
const record = recordChatMessageDelivery as jest.Mock
const mail = sendCustomEmail as jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
  mutedAt.mockResolvedValue(null)
})

describe('deliverChatMessageLocally', () => {
  const local = (requireStored: boolean, notify: 'email' | 'none' = 'email') =>
    deliverChatMessageLocally({
      senderUser: anna,
      recipientUser: ben,
      subject: null,
      body: 'Shall we meet at ten?',
      notify,
      requireStored,
    })

  it('files the message and mails what was asked for to a recipient who did not mute', async () => {
    store.mockResolvedValue(row('delivered'))

    expect(await local(true)).toEqual(row('delivered'))

    expect(mutedAt).toHaveBeenCalledWith(3, { communityUuid: HOME, gradidoId: BEN })
    expect(mail).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'ben@example.org',
        subject: '',
        memo: 'Shall we meet at ten?',
      }),
    )
  })

  it('mails nothing that was not asked for, and nothing to a muted recipient', async () => {
    store.mockResolvedValue(row('delivered'))
    await local(true, 'none')
    mutedAt.mockResolvedValue(new Date())
    await local(true, 'email')

    expect(mail).not.toHaveBeenCalled()
  })

  // ⛔ The chat: the row is the message. Not filed, not sent -- and no mail.
  it('mails nothing where the row that is the message could not be filed', async () => {
    store.mockResolvedValue(null)

    expect(await local(true)).toBeNull()

    expect(mutedAt).not.toHaveBeenCalled()
    expect(mail).not.toHaveBeenCalled()
  })

  // The form: the mail is the message, as it was before the chat.
  it('mails the form message whether its row could be filed or not', async () => {
    store.mockResolvedValue(null)

    expect(await local(false)).toBeNull()

    expect(mail).toHaveBeenCalledTimes(1)
  })
})

describe('deliverChatMessageAcrossBorder', () => {
  const sendCommand = jest.fn()
  const cmdClient = { sendCommand } as unknown as V1_0_CommandClient
  let homeKeys: { publicKey: string; privateKey: string }
  let peerKeys: { publicKey: string; privateKey: string }
  let senderCom: DbCommunity
  let receiverCom: DbCommunity

  beforeAll(async () => {
    homeKeys = await createKeyPair()
    peerKeys = await createKeyPair()
    senderCom = {
      privateJwtKey: homeKeys.privateKey,
      publicKey: Buffer.from('home'),
    } as unknown as DbCommunity
    receiverCom = {
      communityUuid: PEER,
      publicJwtKey: peerKeys.publicKey,
    } as unknown as DbCommunity
  })

  const across = (requireStored: boolean, notify: 'email' | 'none' = 'email') =>
    deliverChatMessageAcrossBorder({
      senderUser: anna,
      senderCom,
      receiverCom,
      receiverComIdentifier: PEER,
      cmdClient,
      recipientGradidoId: BEN,
      subject: null,
      body: 'Shall we meet at ten?',
      notify,
      requireStored,
    })

  /** What the last command carried, opened with the other community's key as it would be. */
  const payload = async () => {
    const [args] = sendCommand.mock.calls[sendCommand.mock.calls.length - 1]
    const command = (await verifyAndDecrypt(
      args.handshakeID,
      args.jwt,
      peerKeys.privateKey,
      homeKeys.publicKey,
    )) as CommandJwtPayloadType
    return JSON.parse(command.commandArgs[0])
  }

  it('files the own copy as pending, sends, and hands back the copy as delivered', async () => {
    const moment = new Date('2026-09-24T12:00:01.000Z')
    store.mockResolvedValue(row('pending'))
    sendCommand.mockResolvedValue(true)
    record.mockResolvedValue(moment)

    const { stored, error } = await across(true)

    expect(store.mock.calls[0][0]).toMatchObject({ deliveryState: 'pending', notify: 'email' })
    expect(record).toHaveBeenCalledWith(5, 'delivered')
    expect(stored).toEqual({ ...row('pending'), deliveryState: 'delivered', lastAttemptAt: moment })
    expect(error).toBeNull()
    expect((await payload()).messageUuid).toBe(store.mock.calls[0][0].messageUuid)
  })

  it('hands back the copy as failed, with the answer of the other side, and throws nothing', async () => {
    store.mockResolvedValue(row('pending'))
    sendCommand.mockResolvedValue('sendCommand failed with response error: nope')
    record.mockResolvedValue(new Date())

    const { stored, error } = await across(true)

    expect(stored?.deliveryState).toBe('failed')
    expect(error).toBe('sendCommand failed with response error: nope')
  })

  // What the row says: where the state could not be recorded, the copy stays as it was filed.
  it('hands back the copy as filed where its state could not be recorded', async () => {
    store.mockResolvedValue(row('pending'))
    sendCommand.mockResolvedValue(true)
    record.mockResolvedValue(null)

    expect((await across(true)).stored).toEqual(row('pending'))
  })

  // ⛔ The chat: what could not be filed was not sent.
  it('sends nothing where the own copy that is the message could not be filed', async () => {
    store.mockResolvedValue(null)

    expect(await across(true)).toEqual({ stored: null, error: null })

    expect(sendCommand).not.toHaveBeenCalled()
  })

  it('sends the form message whether its copy could be filed or not', async () => {
    store.mockResolvedValue(null)
    sendCommand.mockResolvedValue(true)

    expect(await across(false)).toEqual({ stored: null, error: null })

    expect(sendCommand).toHaveBeenCalledTimes(1)
  })

  // Only a wish for no mail travels: without the field every server mails, the old ones too.
  it("carries notify in the command only where it is 'none'", async () => {
    store.mockResolvedValue(row('pending'))
    sendCommand.mockResolvedValue(true)

    await across(true, 'email')
    expect(await payload()).not.toHaveProperty('notify')

    await across(true, 'none')
    expect((await payload()).notify).toBe('none')
  })
})
