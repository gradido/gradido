// AI-GENERATED — not an architecture reference
import { afterEach, beforeEach, describe, expect, it, spyOn } from 'bun:test'
import { inspect } from 'node:util'
import * as database from 'database'
import { getLogger } from '../../../config-schema/test/testSetup.bun'
import { LOG4JS_BASE_CATEGORY_NAME } from '../config/const'
import {
  ChatMessageToStore,
  chatMailWanted,
  chatMessageNotify,
  parseChatMessageNotify,
  readChatMemberMutedAt,
  recordChatMessageDelivery,
  storeChatMessage,
} from './ChatMessage.logic'

// ⛔ spyOn, not mock.module: Bun cannot restore a module mock, and a replaced `database` would
// stay replaced for every test file after this one. The queries behind these spies run against
// a database in database/src/queries/chat*.test.ts.

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.logic.ChatMessage`)

const HOME = '11111111-1111-4111-8111-111111111111'
const ANNA = { communityUuid: HOME, gradidoId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' }
const BEN = { communityUuid: HOME, gradidoId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' }
const MESSAGE_UUID = '10000000-0000-4000-8000-000000000001'
const SUBJECT = 'A private subject'
const BODY = 'A private text that belongs to Anna and Ben alone'

const message: ChatMessageToStore = {
  messageUuid: MESSAGE_UUID,
  sender: ANNA,
  recipient: BEN,
  subject: SUBJECT,
  body: BODY,
  notify: 'email',
  deliveryState: 'delivered',
}

const conversation = {
  id: 7,
  conversationUuid: '20000000-0000-4000-8000-000000000007',
  kind: 'direct',
  homeCommunityUuid: null,
  directPairKey: 'unused here',
  title: null,
  createdByCommunityUuid: HOME,
  createdByGradidoId: ANNA.gradidoId,
  createdAt: new Date(),
} as database.ChatConversationSelect

const storedRow = {
  id: 99,
  messageUuid: MESSAGE_UUID,
  conversationId: conversation.id,
  senderCommunityUuid: HOME,
  senderGradidoId: ANNA.gradidoId,
  subject: SUBJECT,
  body: BODY,
  notify: 'email',
  deliveryState: 'delivered',
  lastAttemptAt: null,
  delaySeconds: null,
  createdAt: new Date(),
  deletedAt: null,
} as database.ChatMessageSelect

/** A failed Drizzle query as it really looks: the parameters are part of the message. */
const failedQuery = () => {
  const error = new Error(
    `Failed query: insert into \`chat_messages\` ... params: ${MESSAGE_UUID},7,${HOME},${ANNA.gradidoId},${SUBJECT},${BODY},email,delivered`,
  ) as Error & { cause: { code: string } }
  error.cause = { code: 'ER_DATA_TOO_LONG' }
  return error
}

/** Everything this file's logger was handed, at any level, as one piece of text. */
const everythingLogged = () =>
  ['trace', 'debug', 'info', 'warn', 'error', 'fatal']
    .flatMap((level) => logger[level].mock.calls)
    .map((call: unknown[]) => inspect(call, { depth: 5 }))
    .join('\n')

let spies: { mockRestore: () => void }[] = []

beforeEach(() => {
  for (const level of ['trace', 'debug', 'info', 'warn', 'error', 'fatal']) {
    logger[level].mockClear()
  }
})

afterEach(() => {
  for (const spy of spies) {
    spy.mockRestore()
  }
  spies = []
})

describe('storeChatMessage', () => {
  it('files the message in the conversation of its two members and hands back the row', async () => {
    const ensure = spyOn(database, 'dbEnsureDirectChatConversation').mockResolvedValue(conversation)
    const insert = spyOn(database, 'dbInsertChatMessage').mockResolvedValue({
      success: true,
      value: storedRow,
    })
    spies = [ensure, insert]

    expect(await storeChatMessage(message, 'local')).toBe(storedRow)

    expect(ensure.mock.calls).toEqual([[ANNA, BEN]])
    expect(insert.mock.calls).toEqual([
      [
        {
          messageUuid: MESSAGE_UUID,
          conversationId: conversation.id,
          senderCommunityUuid: HOME,
          senderGradidoId: ANNA.gradidoId,
          subject: SUBJECT,
          body: BODY,
          notify: 'email',
          deliveryState: 'delivered',
        },
      ],
    ])
  })

  it('logs which message went where, and never its subject or text', async () => {
    spies = [
      spyOn(database, 'dbEnsureDirectChatConversation').mockResolvedValue(conversation),
      spyOn(database, 'dbInsertChatMessage').mockResolvedValue({ success: true, value: storedRow }),
    ]

    await storeChatMessage(message, 'incoming')

    expect(logger.info).toHaveBeenCalledWith(
      `chat message stored: message_uuid=${MESSAGE_UUID} conversation_id=7 branch=incoming`,
    )
    expect(everythingLogged()).not.toContain(SUBJECT)
    expect(everythingLogged()).not.toContain(BODY)
  })

  // The mail must not depend on the new table: a failure comes back as null, not as a throw.
  it('does not throw when the database does, and logs the code instead of the query', async () => {
    spies = [spyOn(database, 'dbEnsureDirectChatConversation').mockRejectedValue(failedQuery())]

    expect(await storeChatMessage(message, 'outgoing')).toBeNull()

    expect(logger.error).toHaveBeenCalledWith(
      `chat message not stored: message_uuid=${MESSAGE_UUID} branch=outgoing (ER_DATA_TOO_LONG)`,
    )
    expect(everythingLogged()).not.toContain(SUBJECT)
    expect(everythingLogged()).not.toContain(BODY)
  })

  it('does not throw when the insert reports a failure', async () => {
    spies = [
      spyOn(database, 'dbEnsureDirectChatConversation').mockResolvedValue(conversation),
      spyOn(database, 'dbInsertChatMessage').mockResolvedValue({
        success: false,
        error: new database.DBInsertFailed('chat_messages', { messageUuid: MESSAGE_UUID }),
      }),
    ]

    expect(await storeChatMessage(message, 'local')).toBeNull()

    expect(logger.error).toHaveBeenCalledWith(
      `chat message not stored: message_uuid=${MESSAGE_UUID} branch=local (DB_INSERT_FAILED in chat_messages)`,
    )
    expect(logger.info).not.toHaveBeenCalled()
  })
})

describe('recordChatMessageDelivery', () => {
  it('records the state with the time of the attempt', async () => {
    const update = spyOn(database, 'dbUpdateChatMessageDelivery').mockResolvedValue({
      success: true,
    })
    spies = [update]
    const before = Date.now()

    await recordChatMessageDelivery(99, 'failed')

    expect(update).toHaveBeenCalledTimes(1)
    const [id, state, attemptAt] = update.mock.calls[0]
    expect([id, state]).toEqual([99, 'failed'])
    expect(attemptAt.getTime()).toBeGreaterThanOrEqual(before)
  })

  it('does not throw for a row that is not there', async () => {
    spies = [
      spyOn(database, 'dbUpdateChatMessageDelivery').mockResolvedValue({
        success: false,
        error: new database.DBNotFoundError('chat_messages', 'id = 99'),
      }),
    ]

    await recordChatMessageDelivery(99, 'delivered')

    expect(logger.warn).toHaveBeenCalledWith(
      'chat message delivery not recorded: id=99 state=delivered (DB_NOT_FOUND in chat_messages where: id = 99)',
    )
  })

  it('does not throw when the database does', async () => {
    const lost = Object.assign(new Error('Connection lost'), { code: 'PROTOCOL_CONNECTION_LOST' })
    spies = [spyOn(database, 'dbUpdateChatMessageDelivery').mockRejectedValue(lost)]

    await recordChatMessageDelivery(99, 'delivered')

    expect(logger.error).toHaveBeenCalledWith(
      'chat message delivery not recorded: id=99 state=delivered (PROTOCOL_CONNECTION_LOST)',
    )
  })
})

describe('recordChatMessageDelivery, what it hands back', () => {
  it('the moment it recorded, the one the row was given', async () => {
    const update = spyOn(database, 'dbUpdateChatMessageDelivery').mockResolvedValue({
      success: true,
    })
    spies = [update]

    const recorded = await recordChatMessageDelivery(99, 'delivered')

    expect(recorded).toBeInstanceOf(Date)
    expect(recorded).toBe(update.mock.calls[0][2])
  })

  it('null for a row that is not there, and when the database throws', async () => {
    const update = spyOn(database, 'dbUpdateChatMessageDelivery').mockResolvedValue({
      success: false,
      error: new database.DBNotFoundError('chat_messages', 'id = 99'),
    })
    spies = [update]
    expect(await recordChatMessageDelivery(99, 'failed')).toBeNull()

    update.mockRejectedValue(Object.assign(new Error('lost'), { code: 'PROTOCOL_CONNECTION_LOST' }))
    expect(await recordChatMessageDelivery(99, 'failed')).toBeNull()
  })
})

describe('readChatMemberMutedAt', () => {
  const memberRow = (mutedAt: Date | null) =>
    ({
      conversationId: 7,
      communityUuid: HOME,
      gradidoId: BEN.gradidoId,
      role: 'member',
      joinedAt: new Date(),
      lastReadMessageId: null,
      mutedAt,
    }) as database.ChatConversationMemberSelect

  it("reads the member's own mark, in the conversation named", async () => {
    const at = new Date('2026-09-24T12:00:00.000Z')
    const select = spyOn(database, 'dbSelectChatConversationMember').mockResolvedValue(
      memberRow(at),
    )
    spies = [select]

    expect(await readChatMemberMutedAt(7, BEN)).toBe(at)
    expect(select.mock.calls).toEqual([[7, BEN]])
  })

  it('null for a member without a mark, and for one who is not in the conversation', async () => {
    const select = spyOn(database, 'dbSelectChatConversationMember').mockResolvedValue(
      memberRow(null),
    )
    spies = [select]
    expect(await readChatMemberMutedAt(7, BEN)).toBeNull()

    select.mockResolvedValue(null)
    expect(await readChatMemberMutedAt(7, BEN)).toBeNull()
  })

  // A mail too many is better than silence: a read that fails counts as not muted.
  it('does not throw when the database does, and counts that as not muted', async () => {
    spies = [spyOn(database, 'dbSelectChatConversationMember').mockRejectedValue(failedQuery())]

    expect(await readChatMemberMutedAt(7, BEN)).toBeNull()

    expect(logger.error).toHaveBeenCalledWith(
      'chat mute mark not read: conversation_id=7 (ER_DATA_TOO_LONG)',
    )
    expect(everythingLogged()).not.toContain(BODY)
  })
})

// E-024, the wake-up call: the first message of two members is always mailed.
describe('chatMessageNotify', () => {
  it('mails the first message between two members, whatever was asked for', () => {
    expect(chatMessageNotify('none', false)).toBe('email')
    expect(chatMessageNotify('email', false)).toBe('email')
  })

  it('carries the wish of the sender for every message after it', () => {
    expect(chatMessageNotify('none', true)).toBe('none')
    expect(chatMessageNotify('email', true)).toBe('email')
  })
})

// E-024: mute beats the tick.
describe('chatMailWanted', () => {
  const at = new Date('2026-09-24T12:00:00.000Z')

  it('mails what the sender asked to be mailed, to a recipient who has not muted', () => {
    expect(chatMailWanted('email', null)).toBe(true)
  })

  it('mails nothing to a muted recipient, whatever the sender asked for', () => {
    expect(chatMailWanted('email', at)).toBe(false)
    expect(chatMailWanted('none', at)).toBe(false)
  })

  it('mails nothing the sender did not ask for', () => {
    expect(chatMailWanted('none', null)).toBe(false)
  })
})

// The receiving server takes only 'none' at its word: anything else is a mail.
describe('parseChatMessageNotify', () => {
  it("takes 'none' as none, and 'email' as a mail", () => {
    expect(parseChatMessageNotify('none')).toBe('none')
    expect(parseChatMessageNotify('email')).toBe('email')
  })

  it('reads a missing wish -- a server from before the chat -- as a mail', () => {
    expect(parseChatMessageNotify(undefined)).toBe('email')
    expect(parseChatMessageNotify(null)).toBe('email')
  })

  it('reads anything it does not know as a mail, the GraphQL name included', () => {
    for (const value of ['NONE', 'nothing', '', 0, false, {}, ['none']]) {
      expect(parseChatMessageNotify(value)).toBe('email')
    }
  })
})
