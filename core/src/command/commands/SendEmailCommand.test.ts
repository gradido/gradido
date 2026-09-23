// AI-GENERATED — not an architecture reference
import { afterEach, beforeEach, describe, expect, it, spyOn } from 'bun:test'
import * as database from 'database'
import { uuidv4Schema } from 'shared'
import * as mails from '../../emails/sendEmailVariants'
import * as chatMessage from '../../logic/ChatMessage.logic'
import { SendEmailCommand, SendEmailCommandParams } from './SendEmailCommand'

// ⛔ spyOn, not mock.module: Bun cannot restore a module mock, and a replaced module stays
// replaced for every test file that runs after this one -- sendEmailVariants.test.ts among them.

const SENDER_COMMUNITY = '22222222-2222-4222-8222-222222222222'
const HOME = '11111111-1111-4111-8111-111111111111'
const SENDER = {
  gradidoID: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  communityUuid: SENDER_COMMUNITY,
  alias: 'anna',
  firstName: 'Anna',
  lastName: 'Far',
  language: 'de',
  emailContact: null,
} as unknown as database.User
const RECIPIENT = {
  gradidoID: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  communityUuid: HOME,
  alias: 'ben',
  firstName: 'Ben',
  lastName: 'Near',
  language: 'de',
  emailContact: { email: 'ben@example.org' },
} as unknown as database.User
const MESSAGE_UUID = '10000000-0000-4000-8000-000000000001'

const params = (rest: Partial<SendEmailCommandParams> = {}): SendEmailCommandParams => ({
  mailType: 'sendCustomEmail',
  senderComUuid: SENDER.communityUuid,
  senderGradidoId: SENDER.gradidoID,
  receiverComUuid: RECIPIENT.communityUuid,
  receiverGradidoId: RECIPIENT.gradidoID,
  subject: 'About Saturday',
  memo: 'Shall we meet at ten?',
  ...rest,
})

const run = (commandParams: object) =>
  new SendEmailCommand([JSON.stringify(commandParams)]).execute()

/** What happened, in order. The store counts when it is done, the mail when it starts. */
let happened: string[] = []
let spies: { mockRestore: () => void }[] = []
let store: ReturnType<typeof spyOn>
let customMail: ReturnType<typeof spyOn>
let receivedMail: ReturnType<typeof spyOn>

beforeEach(() => {
  happened = []
  const findUser = spyOn(database, 'findUserByUuids').mockImplementation(
    async (_communityUuid: string, gradidoId: string) =>
      gradidoId.toLowerCase() === SENDER.gradidoID ? SENDER : RECIPIENT,
  )
  store = spyOn(chatMessage, 'storeChatMessage').mockImplementation(async () => {
    await Promise.resolve()
    happened.push('store')
    return null
  })
  customMail = spyOn(mails, 'sendCustomEmail').mockImplementation(async () => {
    happened.push('mail')
    return true
  })
  receivedMail = spyOn(mails, 'sendTransactionReceivedEmail').mockImplementation(async () => {
    happened.push('receipt')
    return true
  })
  spies = [findUser, store, customMail, receivedMail]
})

afterEach(() => {
  for (const spy of spies) {
    spy.mockRestore()
  }
})

describe('SendEmailCommand, a message from another community', () => {
  it('files the message under the uuid the sender sent, then mails it', async () => {
    await run(params({ messageUuid: MESSAGE_UUID }))

    expect(store.mock.calls).toEqual([
      [
        {
          messageUuid: MESSAGE_UUID,
          sender: { communityUuid: SENDER_COMMUNITY, gradidoId: SENDER.gradidoID },
          recipient: { communityUuid: HOME, gradidoId: RECIPIENT.gradidoID },
          subject: 'About Saturday',
          body: 'Shall we meet at ten?',
          notify: 'email',
          deliveryState: 'delivered',
        },
        'incoming',
      ],
    ])
    expect(customMail).toHaveBeenCalledTimes(1)
    expect(happened).toEqual(['store', 'mail'])
  })

  it('files a message from a server without uuids under one of its own', async () => {
    await run(params())

    const [[filed]] = store.mock.calls as [chatMessage.ChatMessageToStore][]
    expect(uuidv4Schema.safeParse(filed.messageUuid).success).toBe(true)
    expect(customMail).toHaveBeenCalledTimes(1)
  })

  it('replaces a uuid that is none', async () => {
    for (const messageUuid of ['not-a-uuid', 42, `${MESSAGE_UUID}-and-more`]) {
      store.mockClear()
      await run({ ...params(), messageUuid })
      const [[filed]] = store.mock.calls as [chatMessage.ChatMessageToStore][]
      expect(filed.messageUuid).not.toBe(messageUuid)
      expect(uuidv4Schema.safeParse(filed.messageUuid).success).toBe(true)
    }
  })

  it('files the members in the spelling this server stores them in', async () => {
    await run(params({ receiverGradidoId: RECIPIENT.gradidoID.toUpperCase() }))

    const [[filed]] = store.mock.calls as [chatMessage.ChatMessageToStore][]
    expect(filed.recipient.gradidoId).toBe(RECIPIENT.gradidoID)
  })

  it('files a message without a subject with none', async () => {
    await run(params({ subject: '' }))

    const [[filed]] = store.mock.calls as [chatMessage.ChatMessageToStore][]
    expect(filed.subject).toBeNull()
  })

  it('never files the mail about received Gradido', async () => {
    await run(
      params({ mailType: 'sendTransactionReceivedEmail', amount: '10', subject: undefined }),
    )

    expect(store).not.toHaveBeenCalled()
    expect(receivedMail).toHaveBeenCalledTimes(1)
  })

  // The real storeChatMessage this time: whatever the database throws, the mail goes out.
  it('mails the message when the database cannot file it', async () => {
    store.mockRestore()
    const ensure = spyOn(database, 'dbEnsureDirectChatConversation').mockRejectedValue(
      Object.assign(new Error('Connection lost'), { code: 'PROTOCOL_CONNECTION_LOST' }),
    )
    spies.push(ensure)

    await expect(run(params({ messageUuid: MESSAGE_UUID }))).resolves.toBe('result is true')

    expect(ensure).toHaveBeenCalledTimes(1)
    expect(customMail).toHaveBeenCalledTimes(1)
  })
})
