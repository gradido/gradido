// AI-GENERATED — not an architecture reference
import { afterEach, beforeEach, describe, expect, it, spyOn } from 'bun:test'
import * as database from 'database'
import { uuidv4Schema } from 'shared'
import * as mails from '../../emails/sendEmailVariants'
import * as chatMessage from '../../logic/ChatMessage.logic'
import { CommandExecutor } from '../CommandExecutor'
import { CHAT_MESSAGE_RECEIVED, SendEmailCommand, SendEmailCommandParams } from './SendEmailCommand'

// ⛔ spyOn, not mock.module: Bun cannot restore a module mock, and a replaced module stays
// replaced for every test file that runs after this one. Bun takes the order from the file
// system, so that can be sendEmailVariants.test.ts, which tests the real mail functions.

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

    await expect(run(params({ messageUuid: MESSAGE_UUID }))).resolves.toBe(CHAT_MESSAGE_RECEIVED)

    expect(ensure).toHaveBeenCalledTimes(1)
    expect(customMail).toHaveBeenCalledTimes(1)
  })
})

/**
 * E-024 on the receiving server: the sender's wish travels, the recipient's quiet stays here.
 * A mail goes out only when the sender asked for one and the recipient has not muted the
 * conversation -- and the sending server learns nothing of which it was.
 */
describe('SendEmailCommand, the wish and the quiet', () => {
  const filed = {
    id: 5,
    messageUuid: MESSAGE_UUID,
    conversationId: 3,
    senderCommunityUuid: SENDER_COMMUNITY,
    senderGradidoId: SENDER.gradidoID,
    subject: null,
    body: 'Shall we meet at ten?',
    notify: 'email',
    deliveryState: 'delivered',
    lastAttemptAt: null,
    delaySeconds: null,
    createdAt: new Date(),
    deletedAt: null,
  } as database.ChatMessageSelect
  const MUTED = new Date('2026-09-24T12:00:00.000Z')
  let mutedAt: ReturnType<typeof spyOn>

  /** Files the message as the database would, and reads the recipient's mark as `mark`. */
  const recipientHas = (mark: Date | null) => {
    store.mockImplementation(async () => {
      happened.push('store')
      return filed
    })
    mutedAt.mockResolvedValue(mark)
  }

  beforeEach(() => {
    mutedAt = spyOn(chatMessage, 'readChatMemberMutedAt').mockResolvedValue(null)
    spies.push(mutedAt)
  })

  it('files a message sent without a mail as such, and mails nothing', async () => {
    recipientHas(null)

    await run(params({ messageUuid: MESSAGE_UUID, notify: 'none' }))

    const [[message]] = store.mock.calls as [chatMessage.ChatMessageToStore][]
    expect(message.notify).toBe('none')
    expect(customMail).not.toHaveBeenCalled()
  })

  // A server from before the chat, and the form "send an e-mail", send no wish at all.
  it('reads a command without a wish as one that asks for a mail, and mails it', async () => {
    recipientHas(null)

    await run(params({ messageUuid: MESSAGE_UUID }))

    const [[message]] = store.mock.calls as [chatMessage.ChatMessageToStore][]
    expect(message.notify).toBe('email')
    expect(customMail).toHaveBeenCalledTimes(1)
    expect(happened).toEqual(['store', 'mail'])
  })

  it('files a message to a muted recipient and mails nothing, without an error', async () => {
    recipientHas(MUTED)

    await expect(run(params({ messageUuid: MESSAGE_UUID, notify: 'email' }))).resolves.toBe(
      CHAT_MESSAGE_RECEIVED,
    )

    expect(store).toHaveBeenCalledTimes(1)
    // The quiet read is the recipient's own, in the conversation the message was filed in.
    expect(mutedAt.mock.calls).toEqual([
      [filed.conversationId, { communityUuid: HOME, gradidoId: RECIPIENT.gradidoID }],
    ])
    expect(customMail).not.toHaveBeenCalled()
  })

  it('mails a recipient who has not muted the conversation', async () => {
    recipientHas(null)

    await run(params({ messageUuid: MESSAGE_UUID, notify: 'email' }))

    expect(customMail).toHaveBeenCalledTimes(1)
  })

  // The mail is what the recipient had before the chat; without the row it is all they get,
  // and there is no conversation to have muted.
  it('mails a message it could not file, even one sent without a mail', async () => {
    await run(params({ messageUuid: MESSAGE_UUID, notify: 'none' }))

    expect(mutedAt).not.toHaveBeenCalled()
    expect(customMail).toHaveBeenCalledTimes(1)
  })

  /**
   * ⛔ What the sending server receives is what the executor makes of execute(): the command
   * client asks for `data` as well. Measured through the executor, the way the command
   * resolver answers: one answer for a mail, for none, for a muted recipient and for a message
   * that could not be filed.
   */
  it('answers the sending server the same, whether a mail went out or not', async () => {
    const answers = []
    for (const [mark, notify, files] of [
      [null, 'email', true],
      [null, 'none', true],
      [MUTED, 'email', true],
      [null, 'none', false],
    ] as [Date | null, string, boolean][]) {
      if (files) {
        recipientHas(mark)
      } else {
        store.mockImplementation(async () => null)
      }
      const command = new SendEmailCommand([
        JSON.stringify(params({ messageUuid: MESSAGE_UUID, notify })),
      ])
      answers.push(await new CommandExecutor().executeCommand(command))
    }

    expect(customMail).toHaveBeenCalledTimes(2)
    expect(answers).toEqual(
      Array.from({ length: 4 }, () => ({ success: true, data: CHAT_MESSAGE_RECEIVED })),
    )
  })
})
