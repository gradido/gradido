// AI-GENERATED — not an architecture reference
import { afterEach, beforeEach, describe, expect, it, spyOn } from 'bun:test'
import * as database from 'database'
import { CHAT_IMAGE_MAX_BYTES, uuidv4Schema } from 'shared'
import * as mails from '../../emails/sendEmailVariants'
import * as chatMessage from '../../logic/ChatMessage.logic'
import * as chatMessageImage from '../../logic/ChatMessageImage.logic'
import { CommandExecutor } from '../CommandExecutor'
import {
  chatMessageMailStateOfAnswer,
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

    await expect(run(params({ messageUuid: MESSAGE_UUID }))).resolves.toBe(
      SEND_MAIL_COMMAND_ANSWER.MAILED,
    )

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
      SEND_MAIL_COMMAND_ANSWER.MAILED,
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
 * conversation -- and since E-034 the sending server is answered which it was.
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
      SEND_MAIL_COMMAND_ANSWER.MUTED,
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
   * client asks for `data`. Measured through the executor, the way the command resolver
   * answers (E-034): what became of the mail -- mailed, held back by the quiet, or none asked
   * for. A message that could not be filed is mailed as before the chat, and says so.
   */
  it('answers the sending server what became of the mail', async () => {
    const answers = []
    for (const [mark, notify, files] of [
      [null, 'email', true],
      [null, 'none', true],
      [MUTED, 'email', true],
      [MUTED, 'none', true],
      [MUTED, 'letter', true],
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
      answers.push((await new CommandExecutor().executeCommand(command)).data)
    }

    expect(answers).toEqual(['mailed', 'received', 'muted', 'received', 'mailed', 'mailed'])
    expect(customMail).toHaveBeenCalledTimes(3)
  })
})

/**
 * What a mail transport reports names the mail's recipient. It stays on this server: the
 * sending server asks for `data`, and gets one of three fixed values -- never the report.
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

  // coderabbit on #3982: a mail that did not go out is not answered as one. RECEIVED says
  // nothing about a mail; the transport's report still stays here.
  it('answers RECEIVED where the mail did not go out', async () => {
    for (const failed of [undefined, null, new Error('Connection timeout')]) {
      customMail.mockImplementation(async () => failed)

      const answer = await answerTo(params({ messageUuid: MESSAGE_UUID }))

      expect(answer).toEqual({ success: true, data: SEND_MAIL_COMMAND_ANSWER.RECEIVED })
    }
    expect(customMail).toHaveBeenCalledTimes(3)
  })

  // The mail about received Gradido is no message: it answers RECEIVED, mailed or not.
  it('answers the mail about received Gradido with RECEIVED, not with the report', async () => {
    receivedMail.mockImplementation(async () => reported)

    const answer = await answerTo(
      params({ mailType: 'sendTransactionReceivedEmail', amount: '10', subject: undefined }),
    )

    expect(receivedMail).toHaveBeenCalledTimes(1)
    expect(answer).toEqual({ success: true, data: SEND_MAIL_COMMAND_ANSWER.RECEIVED })
    expect(JSON.stringify(answer)).not.toContain('ben@example.org')
  })

  it('answers a mailed message with MAILED, whatever the transport reported', async () => {
    customMail.mockImplementation(async () => reported)

    const answer = await answerTo(params({ messageUuid: MESSAGE_UUID }))

    expect(customMail).toHaveBeenCalledTimes(1)
    expect(answer).toEqual({ success: true, data: SEND_MAIL_COMMAND_ANSWER.MAILED })
    expect(JSON.stringify(answer)).not.toContain('ben@example.org')
  })
})

/**
 * P7b: a chat message from another community with its picture. The picture is checked as the
 * sending server checked it, before anything is filed; filed before its message, under the
 * message's uuid; and the mail says there is one. Filing it runs against a database in
 * database/src/queries/chatMessageImages.test.ts; what the command makes of each answer is held
 * here.
 */
describe('SendEmailCommand, a message with a picture', () => {
  const PICTURE_UUID = '40000000-0000-4000-8000-000000000001'
  const OTHER_PICTURE_UUID = '40000000-0000-4000-8000-000000000002'
  // A JPEG with something recognisable inside.
  const JPEG = Buffer.concat([
    Buffer.from([0xff, 0xd8]),
    Buffer.from('a private picture of Anna and Ben'),
    Buffer.from([0xff, 0xd9]),
  ])
  const filed = {
    id: 5,
    messageUuid: MESSAGE_UUID,
    conversationId: 3,
    senderCommunityUuid: SENDER_COMMUNITY,
    senderGradidoId: SENDER.gradidoID,
    subject: null,
    body: 'Look at this',
    notify: 'email',
    deliveryState: 'delivered',
    lastAttemptAt: null,
    delaySeconds: null,
    createdAt: new Date(),
    deletedAt: null,
  } as database.ChatMessageSelect
  const arrived = (rest: Record<string, unknown> = {}) => ({
    imageUuid: PICTURE_UUID,
    width: 924,
    height: 520,
    data: JPEG.toString('base64'),
    ...rest,
  })
  const withPicture = (
    images: unknown[] = [arrived()],
    rest: Partial<SendEmailCommandParams> = {},
  ) =>
    ({ ...params({ messageUuid: MESSAGE_UUID, memo: 'Look at this', ...rest }), images }) as object

  let storePicture: ReturnType<typeof spyOn>
  let removePictures: ReturnType<typeof spyOn>

  beforeEach(() => {
    store.mockImplementation(async () => {
      happened.push('store')
      return filed
    })
    storePicture = spyOn(chatMessageImage, 'storeIncomingChatMessageImage').mockImplementation(
      async () => {
        happened.push('picture')
        return { success: true, value: 'FILED' }
      },
    )
    removePictures = spyOn(chatMessageImage, 'removeChatMessageImages').mockImplementation(
      async () => {
        happened.push('picture out')
      },
    )
    const mutedAt = spyOn(chatMessage, 'readChatMemberMutedAt').mockResolvedValue(null)
    spies.push(storePicture, removePictures, mutedAt)
  })

  it('files the picture under the message it came with, then the message, then mails that there is one', async () => {
    await expect(run(withPicture())).resolves.toBe(SEND_MAIL_COMMAND_ANSWER.MAILED)

    expect(happened).toEqual(['picture', 'store', 'mail'])
    expect(storePicture.mock.calls).toEqual([
      [
        MESSAGE_UUID,
        { image: JPEG, width: 924, height: 520, imageUuid: PICTURE_UUID, position: 0 },
      ],
    ])
    const [[message]] = store.mock.calls as [chatMessage.ChatMessageToStore][]
    expect(message.messageUuid).toBe(MESSAGE_UUID)
    // MAIL-008: the mail says there is a picture, and carries none.
    expect(customMail).toHaveBeenCalledWith(
      expect.objectContaining({ memo: 'Look at this', hasImage: true }),
    )
    expect(JSON.stringify(customMail.mock.calls)).not.toContain(JPEG.toString('base64'))
    expect(removePictures).not.toHaveBeenCalled()
  })

  // E-044: a picture without a caption is a message.
  it('files and mails a picture without a caption', async () => {
    await run(withPicture([arrived()], { memo: '' }))

    const [[message]] = store.mock.calls as [chatMessage.ChatMessageToStore][]
    expect(message.body).toBe('')
    expect(customMail).toHaveBeenCalledWith(expect.objectContaining({ memo: '', hasImage: true }))
  })

  // A message without a picture runs as before: no picture filed, and no word of one in the mail.
  it('files no picture for a message without one, and mails no word of one', async () => {
    for (const command of [params({ messageUuid: MESSAGE_UUID }), withPicture([])]) {
      await run(command)
    }

    expect(storePicture).not.toHaveBeenCalled()
    expect(customMail).toHaveBeenCalledTimes(2)
    for (const [mail] of customMail.mock.calls) {
      expect(mail).toMatchObject({ hasImage: false })
    }
  })

  // ⛔ A picture this server refuses refuses the whole command: nothing filed -- not even a sender
  // this server does not know yet -- and nothing mailed. The sender sees "not delivered".
  it('refuses the command for a picture that is no JPEG, too large, too many pixels, without a uuid, or one of two -- and files and mails nothing', async () => {
    const answers = []
    for (const images of [
      [arrived({ data: Buffer.from('not an image').toString('base64') })],
      [arrived({ data: Buffer.alloc(CHAT_IMAGE_MAX_BYTES + 1, 0xff).toString('base64') })],
      [arrived({ width: 1000, height: 501 })],
      [arrived({ imageUuid: 'not-a-uuid' })],
      [arrived(), arrived({ imageUuid: OTHER_PICTURE_UUID })],
      [arrived({ data: 42 })],
    ]) {
      answers.push(
        await new CommandExecutor().executeCommand(
          new SendEmailCommand([JSON.stringify(withPicture(images))]),
        ),
      )
    }

    expect(answers).toEqual(
      ['NOT_JPEG', 'TOO_LARGE', 'SIZE', 'NO_UUID', 'TOO_MANY', 'MALFORMED'].map((reason) => ({
        success: false,
        error: `CHAT_IMAGE_NOT_ACCEPTED: ${reason}`,
      })),
    )
    expect(findUser).not.toHaveBeenCalled()
    expect(fileSender).not.toHaveBeenCalled()
    expect(storePicture).not.toHaveBeenCalled()
    expect(store).not.toHaveBeenCalled()
    expect(customMail).not.toHaveBeenCalled()
  })

  // ⛔ The same command twice: one message, one picture, no error -- and the picture the first
  // delivery filed is not taken out again.
  it('takes the same command twice without an error, and takes no picture out', async () => {
    storePicture
      .mockResolvedValueOnce({ success: true, value: 'FILED' })
      .mockResolvedValueOnce({ success: true, value: 'FILED_BEFORE' })

    await expect(run(withPicture())).resolves.toBe(SEND_MAIL_COMMAND_ANSWER.MAILED)
    await expect(run(withPicture())).resolves.toBe(SEND_MAIL_COMMAND_ANSWER.MAILED)

    expect(
      storePicture.mock.calls.map(([messageUuid, picture]) => [messageUuid, picture.imageUuid]),
    ).toEqual([
      [MESSAGE_UUID, PICTURE_UUID],
      [MESSAGE_UUID, PICTURE_UUID],
    ])
    expect(store).toHaveBeenCalledTimes(2)
    expect(removePictures).not.toHaveBeenCalled()
  })

  // Another picture where the message has one already: a contradiction, refused.
  it('refuses the command where another picture is filed in its place, and files and mails nothing', async () => {
    storePicture.mockResolvedValue({ success: false, error: 'CONTRADICTION' })

    await expect(run(withPicture([arrived({ imageUuid: OTHER_PICTURE_UUID })]))).rejects.toThrow(
      'CHAT_IMAGE_NOT_ACCEPTED: CONTRADICTION',
    )

    expect(store).not.toHaveBeenCalled()
    expect(removePictures).not.toHaveBeenCalled()
    expect(customMail).not.toHaveBeenCalled()
  })

  it('refuses the command where the picture could not be filed, and files and mails nothing', async () => {
    storePicture.mockResolvedValue({ success: false, error: 'NOT_STORED' })

    await expect(run(withPicture())).rejects.toThrow('CHAT_MESSAGE_NOT_STORED')

    expect(store).not.toHaveBeenCalled()
    expect(customMail).not.toHaveBeenCalled()
  })

  // ⛔ Unlike a message without a picture, which is mailed as before the chat: a mail would tell of
  // a picture nobody can see.
  it('takes the picture back out and refuses the command where the message could not be filed', async () => {
    store.mockImplementation(async () => null)

    await expect(run(withPicture())).rejects.toThrow('CHAT_MESSAGE_NOT_STORED')

    expect(removePictures.mock.calls).toEqual([[MESSAGE_UUID]])
    expect(happened).toEqual(['picture', 'picture out'])
    expect(customMail).not.toHaveBeenCalled()
  })

  // A picture an earlier delivery of the same command filed belongs to the message that delivery
  // filed: it stays.
  it('leaves a picture filed before where the message could not be filed this time', async () => {
    storePicture.mockResolvedValue({ success: true, value: 'FILED_BEFORE' })
    store.mockImplementation(async () => null)

    await expect(run(withPicture())).rejects.toThrow('CHAT_MESSAGE_NOT_STORED')

    expect(removePictures).not.toHaveBeenCalled()
    expect(customMail).not.toHaveBeenCalled()
  })
})

/** The answer as the sending server reads it back (E-034). */
describe('chatMessageMailStateOfAnswer', () => {
  it('reads MAILED and MUTED as what they say', () => {
    expect(chatMessageMailStateOfAnswer(SEND_MAIL_COMMAND_ANSWER.MAILED)).toBe('mailed')
    expect(chatMessageMailStateOfAnswer(SEND_MAIL_COMMAND_ANSWER.MUTED)).toBe('muted')
  })

  // A server from before P3c answers RECEIVED to every message, or the transport's report.
  it('reads RECEIVED, and anything it does not know, as nothing known', () => {
    for (const answer of ['received', 'MAILED', '', null, undefined, true, { accepted: [] }]) {
      expect(chatMessageMailStateOfAnswer(answer)).toBeNull()
    }
  })
})
