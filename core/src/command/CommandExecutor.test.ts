// AI-GENERATED — not an architecture reference
import { afterEach, beforeAll, beforeEach, describe, expect, it, spyOn } from 'bun:test'
import { randomBytes } from 'node:crypto'
import { inspect } from 'node:util'
import * as database from 'database'
import { getLogger as log4jsGetLogger } from 'log4js'
import { CommandJwtPayloadType } from 'shared'
import { getLogger } from '../../../config-schema/test/testSetup.bun'
import { LOG4JS_BASE_CATEGORY_NAME } from '../config/const'
import * as mails from '../emails/sendEmailVariants'
import * as interpret from '../graphql/logic/interpretEncryptedTransferArgs'
import { EncryptedTransferArgs } from '../graphql/model/EncryptedTransferArgs'
import * as chatMessage from '../logic/ChatMessage.logic'
import * as chatMessageImage from '../logic/ChatMessageImage.logic'
import { CommandExecutor } from './CommandExecutor'
import { SendEmailCommand } from './commands/SendEmailCommand'
import { initializeCommands } from './initCommands'

// ⛔ spyOn, not mock.module: Bun cannot restore a module mock (see SendEmailCommand.test.ts).

const LEVELS = ['trace', 'debug', 'info', 'warn', 'error', 'fatal']
const COMMAND_PATH = `${LOG4JS_BASE_CATEGORY_NAME}.command.`

const SENDER_COMMUNITY = '22222222-2222-4222-8222-222222222222'
const HOME = '11111111-1111-4111-8111-111111111111'
const SENDER = {
  id: 7,
  gradidoID: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  communityUuid: SENDER_COMMUNITY,
  alias: 'anna',
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
const PICTURE = Buffer.concat([
  Buffer.from([0xff, 0xd8]),
  randomBytes(1024),
  Buffer.from([0xff, 0xd9]),
]).toString('base64')

/** The command of a chat message with a picture, as it comes out of its envelope. */
const command = new CommandJwtPayloadType(
  '4294967295',
  SendEmailCommand.SEND_MAIL_COMMAND,
  SendEmailCommand.name,
  [
    JSON.stringify({
      mailType: 'sendCustomEmail',
      senderComUuid: SENDER.communityUuid,
      senderGradidoId: SENDER.gradidoID,
      receiverComUuid: RECIPIENT.communityUuid,
      receiverGradidoId: RECIPIENT.gradidoID,
      subject: '',
      memo: 'Look at this',
      messageUuid: MESSAGE_UUID,
      images: [
        {
          imageUuid: '40000000-0000-4000-8000-000000000001',
          width: 924,
          height: 520,
          data: PICTURE,
        },
      ],
    }),
  ],
)

/** The names of every logger of the command path asked for so far. */
const commandPathLoggers = (): string[] => [
  ...new Set(
    (log4jsGetLogger as unknown as { mock: { calls: [string][] } }).mock.calls
      .map(([name]) => name)
      .filter((name) => name.startsWith(COMMAND_PATH)),
  ),
]

/** Everything the loggers of the command path were handed, at any level, as one text. */
const commandPathLogged = (): string =>
  commandPathLoggers()
    .flatMap((name) => LEVELS.flatMap((level) => getLogger(name)[level].mock.calls))
    .map((call: unknown[]) =>
      call.map((arg) => (typeof arg === 'string' ? arg : inspect(arg, { depth: 8 }))).join(' '),
    )
    .join('\n')

let spies: { mockRestore: () => void }[] = []

beforeAll(() => {
  initializeCommands()
})

beforeEach(() => {
  for (const name of commandPathLoggers()) {
    for (const level of LEVELS) {
      getLogger(name)[level].mockClear()
    }
  }
  spies = [
    spyOn(interpret, 'interpretEncryptedTransferArgs').mockResolvedValue(command),
    spyOn(database, 'findUserByUuids').mockImplementation(
      async (_communityUuid: string, gradidoId: string) =>
        gradidoId === SENDER.gradidoID ? SENDER : RECIPIENT,
    ),
    spyOn(chatMessageImage, 'storeIncomingChatMessageImage').mockResolvedValue({
      success: true,
      value: 'FILED',
    }),
    spyOn(chatMessage, 'storeChatMessage').mockResolvedValue({
      id: 5,
      messageUuid: MESSAGE_UUID,
      conversationId: 3,
    } as database.ChatMessageSelect),
    spyOn(chatMessage, 'readChatMemberMutedAt').mockResolvedValue(null),
    spyOn(mails, 'sendCustomEmail').mockResolvedValue(true),
  ]
})

afterEach(() => {
  for (const spy of spies) {
    spy.mockRestore()
  }
})

/**
 * P7b: the debug lines of the command path write a command as it came -- the executor, the
 * factory, the base command and SendEmailCommand. A picture is written as its length there, some
 * 48,000 characters of one member's picture for another; the text of the message as before.
 */
describe('the command path on level debug, a message with a picture', () => {
  it('runs the command', async () => {
    expect(
      await new CommandExecutor().executeEncryptedCommand(new EncryptedTransferArgs()),
    ).toEqual({ success: true, data: 'mailed' })
  })

  it('writes the picture as its length in every line, and the text as before', async () => {
    await new CommandExecutor().executeEncryptedCommand(new EncryptedTransferArgs())

    const written = commandPathLogged()
    expect(written).not.toContain(PICTURE)
    expect(written).toContain(`*** ${PICTURE.length} characters`)
    expect(written).toContain('Look at this')
    // Each of the four writes the command: none of them may be left out of this.
    for (const part of ['CommandExecutor', 'CommandFactory', 'BaseCommand', 'SendEmailCommand']) {
      expect(commandPathLoggers().some((name) => name.includes(`.${part}.`))).toBe(true)
    }
  })
})
