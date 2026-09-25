// AI-GENERATED — not an architecture reference
import { afterEach, beforeEach, describe, expect, it, spyOn } from 'bun:test'
import * as database from 'database'
import { uuidv4Schema } from 'shared'
import * as mails from '../../emails/sendEmailVariants'
import * as chatMessage from '../../logic/ChatMessage.logic'
import { CommandExecutor } from '../CommandExecutor'
import {
  SEND_MAIL_COMMAND_ANSWER,
  SendEmailCommand,
  SendEmailCommandParams,
} from './SendEmailCommand'

// ⛔ spyOn, not mock.module: Bun cannot restore a module mock, and a replaced module stays
// replaced for every test file that runs after this one. Bun takes the order from the file
// system, so that can be sendEmailVariants.test.ts, which tests the real mail functions.

const SENDER_COMMUNITY = '22222222-2222-4222-8222-222222222222'
const HOME = '11111111-1111-4111-8111-111111111111'
const SENDER = {
  id: 7,
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
let findUser: ReturnType<typeof spyOn>
let store: ReturnType<typeof spyOn>
let customMail: ReturnType<typeof spyOn>
let receivedMail: ReturnType<typeof spyOn>
let senderCommunity: ReturnType<typeof spyOn>
let fileSender: ReturnType<typeof spyOn>
let updateAlias: ReturnType<typeof spyOn>

beforeEach(() => {
  happened = []
  findUser = spyOn(database, 'findUserByUuids').mockImplementation(
    async (_communityUuid: string, gradidoId: string) =>
      gradidoId.toLowerCase() === SENDER.gradidoID ? SENDER : RECIPIENT,
  )
  // A known sender needs none of these; a test that reaches one says so.
  senderCommunity = spyOn(database, 'getCommunityByUuid').mockImplementation(async () => {
    throw new Error('not asked about a community in this test')
  })
  fileSender = spyOn(database, 'dbInsertForeignUser').mockImplementation(async () => {
    throw new Error('not filing a sender in this test')
  })
  updateAlias = spyOn(database, 'dbUpdateForeignUserAlias').mockImplementation(async () => {
    throw new Error('not updating an alias in this test')
  })
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
  spies = [findUser, store, customMail, receivedMail, senderCommunity, fileSender, updateAlias]
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

    await expect(run(params({ messageUuid: MESSAGE_UUID }))).resolves.toBe(SEND_MAIL_COMMAND_ANSWER)

    expect(ensure).toHaveBeenCalledTimes(1)
    expect(customMail).toHaveBeenCalledTimes(1)
  })
})

/**
 * E-034: a message from a member of another community who never sent Gradido here. The
 * receiving side of a transfer files its sender; a message now does the same -- foreign, the
 * pair, the alias -- where it used to fail with "Sender user not found".
 */
describe('SendEmailCommand, a sender this server does not know yet', () => {
  const FILED_ID = 42
  /** The sender's row as this server holds it: none until it is filed. */
  let onFile: database.User | null

  beforeEach(() => {
    onFile = null
    findUser.mockImplementation(async (_communityUuid: string, gradidoId: string) => {
      switch (gradidoId.toLowerCase()) {
        case RECIPIENT.gradidoID:
          return RECIPIENT
        case SENDER.gradidoID:
          return onFile
        default:
          return null
      }
    })
    senderCommunity.mockImplementation(
      async () => ({ communityUuid: SENDER_COMMUNITY, foreign: true }) as database.Community,
    )
    fileSender.mockImplementation(async (member: { communityUuid: string; gradidoId: string }) => {
      happened.push('file sender')
      onFile = {
        ...SENDER,
        id: FILED_ID,
        communityUuid: member.communityUuid,
        gradidoID: member.gradidoId,
        alias: null,
        firstName: null,
        lastName: null,
      } as unknown as database.User
      return { success: true, value: FILED_ID }
    })
    updateAlias.mockImplementation(async (_id: number, alias: string) => {
      happened.push('alias')
      if (onFile) {
        onFile.alias = alias
      }
      return { success: true }
    })
  })

  it('files the sender with the pair and the alias, then files and mails the message', async () => {
    await expect(run(params({ messageUuid: MESSAGE_UUID, senderAlias: 'anna' }))).resolves.toBe(
      SEND_MAIL_COMMAND_ANSWER,
    )

    // The pair and nothing else -- no names travel, and none are filed.
    expect(fileSender.mock.calls).toEqual([
      [{ communityUuid: SENDER_COMMUNITY, gradidoId: SENDER.gradidoID }],
    ])
    expect(updateAlias.mock.calls).toEqual([[FILED_ID, 'anna']])
    expect(senderCommunity.mock.calls).toEqual([[SENDER_COMMUNITY]])
    const [[message]] = store.mock.calls as [chatMessage.ChatMessageToStore][]
    expect(message.sender).toEqual({ communityUuid: SENDER_COMMUNITY, gradidoId: SENDER.gradidoID })
    expect(customMail).toHaveBeenCalledWith(expect.objectContaining({ senderAlias: 'anna' }))
    expect(happened).toEqual(['file sender', 'alias', 'store', 'mail'])
  })

  it('files a sender who has no alias without one, and names them by their id', async () => {
    await run(params({ messageUuid: MESSAGE_UUID }))

    expect(fileSender).toHaveBeenCalledTimes(1)
    expect(updateAlias).not.toHaveBeenCalled()
    expect(customMail).toHaveBeenCalledWith(
      expect.objectContaining({ senderAlias: SENDER.gradidoID }),
    )
  })

  it('brings the alias of a sender on file up to date', async () => {
    onFile = { ...SENDER, alias: 'anna' } as unknown as database.User

    await run(params({ messageUuid: MESSAGE_UUID, senderAlias: 'annaFar' }))

    expect(fileSender).not.toHaveBeenCalled()
    expect(updateAlias.mock.calls).toEqual([[SENDER.id, 'annaFar']])
    expect(customMail).toHaveBeenCalledWith(expect.objectContaining({ senderAlias: 'annaFar' }))
  })

  // Silence is "nothing new to say", not "it is gone" -- as with a transfer.
  it('keeps the alias on file when the command carries none, or the same one', async () => {
    onFile = { ...SENDER, alias: 'anna' } as unknown as database.User

    await run(params({ messageUuid: MESSAGE_UUID }))
    await run(params({ messageUuid: MESSAGE_UUID, senderAlias: '' }))
    await run(params({ messageUuid: MESSAGE_UUID, senderAlias: 'anna' }))

    expect(updateAlias).not.toHaveBeenCalled()
    expect(onFile.alias).toBe('anna')
    expect(customMail).toHaveBeenCalledTimes(3)
  })

  it('takes no alias the column could not hold', async () => {
    await run(params({ messageUuid: MESSAGE_UUID, senderAlias: 'a'.repeat(21) }))
    await run({ ...params({ messageUuid: MESSAGE_UUID }), senderAlias: 42 })

    expect(fileSender).toHaveBeenCalledTimes(1)
    expect(updateAlias).not.toHaveBeenCalled()
  })

  // Another row of that community still holds the name: filed without it, and mailed.
  it('files the sender without the alias where the alias cannot be set, and mails', async () => {
    updateAlias.mockResolvedValue({ success: false, error: new Error('DB_DUPLICATE_ENTRY') })

    await run(params({ messageUuid: MESSAGE_UUID, senderAlias: 'taken' }))

    expect(store).toHaveBeenCalledTimes(1)
    expect(customMail).toHaveBeenCalledWith(
      expect.objectContaining({ senderAlias: SENDER.gradidoID }),
    )
  })

  it('still refuses the mail about received Gradido from a sender it does not know', async () => {
    await expect(
      run(params({ mailType: 'sendTransactionReceivedEmail', amount: '10', senderAlias: 'anna' })),
    ).rejects.toThrow('Sender user not found')

    expect(fileSender).not.toHaveBeenCalled()
    expect(senderCommunity).not.toHaveBeenCalled()
    expect(receivedMail).not.toHaveBeenCalled()
  })

  // Never a row under this community's own uuid, and none for a community nobody here knows.
  it('files nobody of a community it does not know as a foreign one', async () => {
    for (const community of [
      null,
      { communityUuid: SENDER_COMMUNITY, foreign: false } as database.Community,
    ]) {
      senderCommunity.mockResolvedValue(community)

      await expect(run(params({ messageUuid: MESSAGE_UUID, senderAlias: 'anna' }))).rejects.toThrow(
        'Sender user not found',
      )
    }

    expect(fileSender).not.toHaveBeenCalled()
    expect(store).not.toHaveBeenCalled()
    expect(customMail).not.toHaveBeenCalled()
  })

  it('files nobody for a pair that is no pair of uuids', async () => {
    await expect(
      run(params({ senderGradidoId: 'not-a-uuid', senderAlias: 'anna' })),
    ).rejects.toThrow('Sender user not found')
    await expect(run(params({ senderComUuid: 'not-a-uuid', senderAlias: 'anna' }))).rejects.toThrow(
      'Sender user not found',
    )

    expect(fileSender).not.toHaveBeenCalled()
  })

  // What cannot be filed leaves the sender unknown: the command fails as it did before.
  it('fails as before where the sender cannot be filed', async () => {
    fileSender.mockResolvedValueOnce({ success: false, error: new Error('DB_INSERT_FAILED') })
    await expect(run(params({ messageUuid: MESSAGE_UUID }))).rejects.toThrow(
      'Sender user not found',
    )
    fileSender.mockRejectedValueOnce(
      Object.assign(new Error('Connection lost'), { code: 'PROTOCOL_CONNECTION_LOST' }),
    )
    await expect(run(params({ messageUuid: MESSAGE_UUID }))).rejects.toThrow(
      'Sender user not found',
    )

    expect(store).not.toHaveBeenCalled()
    expect(customMail).not.toHaveBeenCalled()
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
      SEND_MAIL_COMMAND_ANSWER,
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

  // E-034, A3: the form "send an e-mail" writes letters, and a letter is mailed whatever the
  // quiet -- which is about chat messages. Filed as a wish for a mail.
  it('mails a letter to a recipient who muted the conversation', async () => {
    recipientHas(MUTED)

    await run(params({ messageUuid: MESSAGE_UUID, notify: 'letter' }))

    const [[message]] = store.mock.calls as [chatMessage.ChatMessageToStore][]
    expect(message.notify).toBe('email')
    expect(customMail).toHaveBeenCalledTimes(1)
    expect(happened).toEqual(['store', 'mail'])
  })

  it('mails a letter to a recipient who has not muted the conversation', async () => {
    recipientHas(null)

    await run(params({ messageUuid: MESSAGE_UUID, notify: 'letter' }))

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
      Array.from({ length: 4 }, () => ({ success: true, data: SEND_MAIL_COMMAND_ANSWER })),
    )
  })
})

/**
 * What a mail transport reports names the mail's recipient. It stays on this server: the
 * sending server asks for `data` as well, and gets the same fixed value for both kinds of mail.
 */
describe('SendEmailCommand, what the sending server is answered', () => {
  const reported = {
    accepted: ['ben@example.org'],
    rejected: [],
    envelope: { from: 'info@gradido.net', to: ['ben@example.org'] },
    messageSize: 37478,
    response: '250 2.0.0 Ok: queued',
  }
  const answerTo = (commandParams: object) =>
    new CommandExecutor().executeCommand(new SendEmailCommand([JSON.stringify(commandParams)]))

  it('answers the mail about received Gradido with the fixed value, not with the report', async () => {
    receivedMail.mockImplementation(async () => reported)

    const answer = await answerTo(
      params({ mailType: 'sendTransactionReceivedEmail', amount: '10', subject: undefined }),
    )

    expect(receivedMail).toHaveBeenCalledTimes(1)
    expect(answer).toEqual({ success: true, data: SEND_MAIL_COMMAND_ANSWER })
    expect(JSON.stringify(answer)).not.toContain('ben@example.org')
  })

  it('answers a message the same way, whatever the transport reported', async () => {
    customMail.mockImplementation(async () => reported)

    const answer = await answerTo(params({ messageUuid: MESSAGE_UUID }))

    expect(customMail).toHaveBeenCalledTimes(1)
    expect(answer).toEqual({ success: true, data: SEND_MAIL_COMMAND_ANSWER })
    expect(JSON.stringify(answer)).not.toContain('ben@example.org')
  })
})
