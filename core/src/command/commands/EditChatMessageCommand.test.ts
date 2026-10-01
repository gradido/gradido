// AI-GENERATED — not an architecture reference
import { afterEach, beforeAll, beforeEach, describe, expect, it, spyOn } from 'bun:test'
import * as database from 'database'
import { CommandJwtPayloadType, MESSAGE_MAX_CHARS } from 'shared'
import { getLogger } from '../../../../config-schema/test/testSetup.bun'
import { LOG4JS_BASE_CATEGORY_NAME } from '../../config/const'
import * as interpret from '../../graphql/logic/interpretEncryptedTransferArgs'
import { EncryptedTransferArgs } from '../../graphql/model/EncryptedTransferArgs'
import { CommandExecutor } from '../CommandExecutor'
import { CommandFactory } from '../CommandFactory'
import { initializeCommands } from '../initCommands'
import {
  EDIT_CHAT_MESSAGE_COMMAND_ANSWER,
  EDIT_CHAT_MESSAGE_COMMAND_REFUSED,
  EditChatMessageCommand,
} from './EditChatMessageCommand'

// ⛔ spyOn, not mock.module: Bun cannot restore a module mock (see SendEmailCommand.test.ts).

/**
 * A member of another community changed a message they wrote to a member here (E-060). What the
 * database would do is a spy: the subject is who the command lets change what -- the community
 * that sealed it, the community it names its writer in, and the sender of the message on file
 * have to be the same writer.
 */
const WRITERS_COMMUNITY = '22222222-2222-4222-8222-222222222222'
const ANOTHER_COMMUNITY = '33333333-3333-4333-8333-333333333333'
const WRITER = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const MESSAGE_UUID = '10000000-0000-4000-8000-000000000001'
const NEW_TEXT = 'Der Hofflohmarkt ist am Samstag ab 10 Uhr.'
// The key the writer's community is on file with here -- and the one the envelope was opened with.
const WRITERS_KEY = Buffer.alloc(32, 9)
const ANOTHER_KEY = Buffer.alloc(32, 5)
const SEALED_BY_THE_WRITERS = WRITERS_KEY.toString('hex')

const LOGGER = `${LOG4JS_BASE_CATEGORY_NAME}.command.commands.EditChatMessageCommand.execute`
const LEVELS = ['trace', 'debug', 'info', 'warn', 'error', 'fatal']
/** Everything this command wrote to its own log, at any level, as one text. */
const logged = (): string =>
  JSON.stringify(LEVELS.flatMap((level) => getLogger(LOGGER)[level].mock.calls))

const params = (rest: Record<string, unknown> = {}): Record<string, unknown> => ({
  senderComUuid: WRITERS_COMMUNITY,
  senderGradidoId: WRITER,
  messageUuid: MESSAGE_UUID,
  body: NEW_TEXT,
  ...rest,
})

/**
 * Runs the command as it comes out of an envelope sealed with `sealedBy` -- `null` for a command
 * that came without any key.
 */
const run = (commandParams: unknown = params(), sealedBy: string | null = SEALED_BY_THE_WRITERS) =>
  new EditChatMessageCommand([JSON.stringify(commandParams)], sealedBy ?? undefined).execute()

/** The reason the command refused with, or what it answered. */
const outcome = async (
  commandParams: unknown = params(),
  sealedBy: string | null = SEALED_BY_THE_WRITERS,
): Promise<string> => {
  try {
    return await run(commandParams, sealedBy)
  } catch (error) {
    return (error as Error).message
  }
}

let spies: { mockRestore: () => void }[] = []
let community: ReturnType<typeof spyOn>
let pictures: ReturnType<typeof spyOn>
let update: ReturnType<typeof spyOn>

const nothingWritten = () => expect(update).not.toHaveBeenCalled()

beforeAll(() => {
  initializeCommands()
})

beforeEach(() => {
  for (const level of LEVELS) {
    getLogger(LOGGER)[level].mockClear()
  }
  community = spyOn(database, 'getCommunityByUuid').mockImplementation(async (uuid: string) =>
    uuid === WRITERS_COMMUNITY
      ? ({ communityUuid: WRITERS_COMMUNITY, publicKey: WRITERS_KEY } as database.Community)
      : uuid === ANOTHER_COMMUNITY
        ? ({ communityUuid: ANOTHER_COMMUNITY, publicKey: ANOTHER_KEY } as database.Community)
        : null,
  )
  pictures = spyOn(database, 'dbSelectChatMessageImageInfos').mockResolvedValue([])
  update = spyOn(database, 'dbUpdateChatMessageBody').mockImplementation(
    async (messageUuid: string, _writer: database.ChatMemberRef, body: string) => ({
      success: true,
      value: { id: 5, messageUuid, conversationId: 3, body } as database.ChatMessageSelect,
    }),
  )
  spies = [community, pictures, update]
})

afterEach(() => {
  for (const spy of spies) {
    spy.mockRestore()
  }
})

describe('EditChatMessageCommand, a change from another community (E-060)', () => {
  it('changes the message for its writer, and answers the one word that says so', async () => {
    expect(await run()).toBe(EDIT_CHAT_MESSAGE_COMMAND_ANSWER)
    expect(EDIT_CHAT_MESSAGE_COMMAND_ANSWER).toBe('edited')

    expect(update.mock.calls).toEqual([
      [MESSAGE_UUID, { communityUuid: WRITERS_COMMUNITY, gradidoId: WRITER }, NEW_TEXT],
    ])
    expect(community.mock.calls).toEqual([[WRITERS_COMMUNITY]])
  })

  describe('lets a community change only what its own members wrote:', () => {
    // ⛔ FÖD-14, closed for this command: what a command says about its sender is not taken on
    // trust. A server that exchanged keys with this one could otherwise name any community.
    it('refuses a command sealed by another community than the one it names its writer in', async () => {
      expect(await outcome(params(), ANOTHER_KEY.toString('hex'))).toBe(
        EDIT_CHAT_MESSAGE_COMMAND_REFUSED.NOT_THE_WRITERS_COMMUNITY,
      )
      // The other way round as well: sealed by the writer's, naming another community.
      expect(await outcome(params({ senderComUuid: ANOTHER_COMMUNITY }))).toBe(
        EDIT_CHAT_MESSAGE_COMMAND_REFUSED.NOT_THE_WRITERS_COMMUNITY,
      )
      nothingWritten()
    })

    it('refuses a command that came without a key, or with what is none', async () => {
      for (const noKey of [null, '', 'zz', WRITERS_KEY.toString('hex').slice(0, 62)]) {
        expect(await outcome(params(), noKey)).toBe(
          EDIT_CHAT_MESSAGE_COMMAND_REFUSED.NOT_THE_WRITERS_COMMUNITY,
        )
      }
      nothingWritten()
    })

    it('refuses a writer in a community not known here', async () => {
      expect(await outcome(params({ senderComUuid: '44444444-4444-4444-8444-444444444444' }))).toBe(
        EDIT_CHAT_MESSAGE_COMMAND_REFUSED.NOT_THE_WRITERS_COMMUNITY,
      )
      nothingWritten()
    })

    it('takes the key in capitals for the same key', async () => {
      expect(await run(params(), SEALED_BY_THE_WRITERS.toUpperCase())).toBe('edited')
    })

    // The third of the three: the sender of the message on file. The write names the pair in its
    // where clause, and a pair that wrote no such message changes nothing.
    it('refuses a message that writer did not write, as one this server does not have', async () => {
      update.mockResolvedValue({
        success: false,
        error: new database.DBNotFoundError('chat_messages', 'message_uuid for its sender'),
      })
      expect(await outcome()).toBe(EDIT_CHAT_MESSAGE_COMMAND_REFUSED.UNKNOWN_MESSAGE)
    })
  })

  describe('refuses what is no change of a message:', () => {
    it('an argument that is missing or is no uuid', async () => {
      for (const broken of [
        params({ senderComUuid: undefined }),
        params({ senderGradidoId: 'anna' }),
        params({ messageUuid: '5' }),
        params({ messageUuid: null }),
        params({ body: undefined }),
        params({ body: 42 }),
        params({ body: ['a text in a list'] }),
        'no object at all',
        null,
      ]) {
        expect(await outcome(broken)).toBe(EDIT_CHAT_MESSAGE_COMMAND_REFUSED.INVALID)
      }
      nothingWritten()
      // Not even the community is looked up for it.
      expect(community).not.toHaveBeenCalled()
    })

    it('arguments that are no JSON', async () => {
      const command = new EditChatMessageCommand([`{ "body": "${NEW_TEXT}`], SEALED_BY_THE_WRITERS)
      await expect(command.execute()).rejects.toThrow(EDIT_CHAT_MESSAGE_COMMAND_REFUSED.INVALID)
      nothingWritten()
    })

    // The bounds of a message being sent: 2000 characters, an emoji counted as one.
    it('a text longer than a message may be', async () => {
      expect(await outcome(params({ body: 'x'.repeat(MESSAGE_MAX_CHARS + 1) }))).toBe(
        EDIT_CHAT_MESSAGE_COMMAND_REFUSED.INVALID,
      )
      nothingWritten()

      expect(await outcome(params({ body: 'x'.repeat(MESSAGE_MAX_CHARS) }))).toBe('edited')
      expect(await outcome(params({ body: '🌻'.repeat(MESSAGE_MAX_CHARS) }))).toBe('edited')
      expect(await outcome(params({ body: '🌻'.repeat(MESSAGE_MAX_CHARS + 1) }))).toBe(
        EDIT_CHAT_MESSAGE_COMMAND_REFUSED.INVALID,
      )
    })

    it('a text emptied, where the message carries no picture', async () => {
      expect(await outcome(params({ body: '' }))).toBe(EDIT_CHAT_MESSAGE_COMMAND_REFUSED.EMPTY)
      expect(pictures.mock.calls).toEqual([[[MESSAGE_UUID]]])
      nothingWritten()
    })
  })

  // E-044: a picture without a caption is a message.
  it('takes a caption emptied where the picture stays', async () => {
    pictures.mockResolvedValue([
      { imageUuid: 'p', messageUuid: MESSAGE_UUID, position: 0, width: 4, height: 3 },
    ])
    expect(await run(params({ body: '' }))).toBe('edited')
    expect(update.mock.calls[0][2]).toBe('')
  })

  it('asks for the pictures only where the text is emptied', async () => {
    await run()
    expect(pictures).not.toHaveBeenCalled()
  })

  // ⛔ A failed query carries its parameters in its message, the text among them. An error thrown
  // out of a command is written to this server's log and travels back in the answer.
  it('keeps what the database throws to itself: a code in the log, a fixed refusal in the answer', async () => {
    update.mockImplementation(async () => {
      throw Object.assign(
        new Error(`Failed query: update \`chat_messages\` set \`body\` = ? params: ${NEW_TEXT}`),
        { cause: { code: 'ER_LOCK_WAIT_TIMEOUT' } },
      )
    })

    expect(await outcome()).toBe(EDIT_CHAT_MESSAGE_COMMAND_REFUSED.NOT_STORED)
    expect(logged()).toContain(`message_uuid=${MESSAGE_UUID} (ER_LOCK_WAIT_TIMEOUT)`)
    expect(logged()).not.toContain('Hofflohmarkt')
    expect(logged()).not.toContain('Failed query')
  })

  it('writes the uuid and the reason into its log, never the text', async () => {
    await run()
    await outcome(params(), ANOTHER_KEY.toString('hex'))
    await outcome(params({ messageUuid: `not a uuid, but ${NEW_TEXT}` }))

    const written = logged()
    expect(written).toContain(`chat message edited: message_uuid=${MESSAGE_UUID}`)
    expect(written).toContain(
      `chat message not edited: message_uuid=${MESSAGE_UUID} (${EDIT_CHAT_MESSAGE_COMMAND_REFUSED.NOT_THE_WRITERS_COMMUNITY})`,
    )
    // What came in the place of the uuid is not written either.
    expect(written).toContain('message_uuid=none')
    expect(written).not.toContain('Hofflohmarkt')
  })
})

/**
 * The frame around the command: the factory knows it by its name, and the executor hands it the
 * key the envelope was opened with -- the one a foreign server cannot make up.
 */
describe('EDIT_CHAT_MESSAGE_COMMAND in the command frame', () => {
  const envelope = (publicKey: string): EncryptedTransferArgs => {
    const args = new EncryptedTransferArgs()
    args.publicKey = publicKey
    args.jwt = 'sealed'
    args.handshakeID = '4294967295'
    return args
  }
  let opened: ReturnType<typeof spyOn>

  beforeEach(() => {
    // The envelope is opened elsewhere (interpretEncryptedTransferArgs, with the key of the
    // community `publicKey` names); here it holds this command.
    opened = spyOn(interpret, 'interpretEncryptedTransferArgs').mockResolvedValue(
      new CommandJwtPayloadType(
        '4294967295',
        EditChatMessageCommand.EDIT_CHAT_MESSAGE_COMMAND,
        EditChatMessageCommand.name,
        [JSON.stringify(params())],
      ),
    )
    spies.push(opened)
  })

  it('is known to the factory by its name', () => {
    expect(EditChatMessageCommand.EDIT_CHAT_MESSAGE_COMMAND).toBe('EDIT_CHAT_MESSAGE_COMMAND')
    expect(
      CommandFactory.getInstance().createCommand('EDIT_CHAT_MESSAGE_COMMAND', [
        JSON.stringify(params()),
      ]),
    ).toBeInstanceOf(EditChatMessageCommand)
  })

  it('runs with the key of the envelope, and answers the word', async () => {
    expect(
      await new CommandExecutor().executeEncryptedCommand(envelope(SEALED_BY_THE_WRITERS)),
    ).toEqual({ success: true, data: 'edited' })
    expect(update).toHaveBeenCalledTimes(1)
  })

  // The same command in an envelope of another community: the key is the envelope's, whatever
  // the command says.
  it('refuses with the reason where another community sealed the envelope', async () => {
    expect(
      await new CommandExecutor().executeEncryptedCommand(envelope(ANOTHER_KEY.toString('hex'))),
    ).toEqual({
      success: false,
      error: EDIT_CHAT_MESSAGE_COMMAND_REFUSED.NOT_THE_WRITERS_COMMUNITY,
    })
    nothingWritten()
  })

  // What reaches the sending server where the database failed: the fixed refusal, no query.
  it('answers a failed database with the fixed refusal, and no text', async () => {
    update.mockImplementation(async () => {
      throw new Error(`Failed query: update \`chat_messages\` set \`body\` = ? params: ${NEW_TEXT}`)
    })
    const answer = await new CommandExecutor().executeEncryptedCommand(
      envelope(SEALED_BY_THE_WRITERS),
    )
    expect(answer).toEqual({ success: false, error: EDIT_CHAT_MESSAGE_COMMAND_REFUSED.NOT_STORED })
    expect(JSON.stringify(answer)).not.toContain('Hofflohmarkt')
  })
})
