// AI-GENERATED — not an architecture reference
import {
  ChatMemberRef,
  dbSelectChatMessageImageInfos,
  dbUpdateChatMessageBody,
  getCommunityByUuid,
} from 'database'
import { getLogger } from 'log4js'
import { Ed25519PublicKey, MESSAGE_MAX_CHARS, MESSAGE_MIN_CHARS, uuidv4Schema } from 'shared'
import { LOG4JS_BASE_CATEGORY_NAME } from '../../config/const'
import { databaseErrorCode } from '../../logic/ChatMessage.logic'
import { BaseCommand } from '../BaseCommand'

const createLogger = (method: string) =>
  getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.command.commands.EditChatMessageCommand.${method}`)

/**
 * What the command answers where it changed the message. One fixed word: the sending server
 * changes its own copy only where it reads exactly this (E-060) -- "no error" is not enough.
 */
export const EDIT_CHAT_MESSAGE_COMMAND_ANSWER = 'edited'

/**
 * Why the command refused, as it travels back in the answer's error. The sending server hands the
 * reason on to its member's wallet; nothing here names a text.
 */
export const EDIT_CHAT_MESSAGE_COMMAND_REFUSED = {
  // An argument is missing or is not what it must be.
  INVALID: 'CHAT_MESSAGE_NOT_EDITED: INVALID',
  // The community that sealed the command is not the one the message's writer is named in.
  NOT_THE_WRITERS_COMMUNITY: 'CHAT_MESSAGE_NOT_EDITED: NOT_THE_WRITERS_COMMUNITY',
  // No text, where the message carries no picture.
  EMPTY: 'CHAT_MESSAGE_NOT_EDITED: EMPTY',
  // No message of that writer under that uuid here -- or it is marked deleted, or a forwarded copy.
  UNKNOWN_MESSAGE: 'CHAT_MESSAGE_NOT_EDITED: UNKNOWN_MESSAGE',
  // The database failed; this server's log has its error code.
  NOT_STORED: 'CHAT_MESSAGE_NOT_EDITED: NOT_STORED',
} as const

export interface EditChatMessageCommandParams {
  // The writer of the message, by the pair this server filed the message's copy under.
  senderComUuid: string
  senderGradidoId: string
  // The uuid both copies carry (E-007).
  messageUuid: string
  // The text the message is to have from now on.
  body: string
}

/**
 * A member of another community changed a message they wrote to a member here (Bernd,
 * 01.10.2026, E-060): the copy this server filed gets the new text and says "bearbeitet", as the
 * sending server's own copy does once this command has answered.
 *
 * A command of its own, not a field of SEND_MAIL_COMMAND: a server from before it answers
 * "Command EDIT_CHAT_MESSAGE_COMMAND not found", and the sending server leaves the message as it
 * was. Carried by SEND_MAIL_COMMAND, an older server would file the changed text as a new message
 * and mail it.
 *
 * ⛔ Who may change what. Three things have to be the same writer, and each is checked here:
 * - the community that sealed the command -- its key reaches this command from the executor, where
 *   the envelope was opened with it --
 * - the community the command names its writer in (`senderComUuid`),
 * - and the sender of the message this server has on file (dbUpdateChatMessageBody names the pair
 *   in its where clause).
 * So a server changes messages its own members wrote, and no others. FÖD-14 stands for the
 * commands before this one; this one does not rely on what a command says about its sender.
 *
 * Nothing is mailed and nothing else on the row changes. The recipient's wallet takes the new text
 * with its beat (newChatMessagesSince, `edited`).
 *
 * What this command writes to the log itself names the message's uuid, never a text. The debug
 * lines of the command path write every command as it came (commandArgsForLog), this one too.
 */
export class EditChatMessageCommand extends BaseCommand<string> {
  static readonly EDIT_CHAT_MESSAGE_COMMAND = 'EDIT_CHAT_MESSAGE_COMMAND'
  protected requiredFields: string[] = ['senderComUuid', 'senderGradidoId', 'messageUuid', 'body']
  protected editParams: Partial<EditChatMessageCommandParams>

  /**
   * @param requestingPublicKey the public key of the community that sealed the command, as hex --
   *   from the envelope the executor opened. Without one, the command refuses.
   */
  constructor(
    params: any[],
    protected readonly requestingPublicKey?: string,
  ) {
    super(params)
    this.editParams = EditChatMessageCommand.parsed(params)
  }

  /** The arguments as an object, or none where they are no JSON object. */
  private static parsed(params: any[]): Partial<EditChatMessageCommandParams> {
    try {
      const parsed: unknown = JSON.parse(params[0])
      return typeof parsed === 'object' && parsed !== null ? parsed : {}
    } catch {
      return {}
    }
  }

  async execute(): Promise<string> {
    const methodLogger = createLogger(`execute`)
    const refuse = (reason: string): never => {
      methodLogger.warn(
        `chat message not edited: message_uuid=${
          uuidv4Schema.safeParse(this.editParams.messageUuid).success
            ? this.editParams.messageUuid
            : 'none'
        } (${reason})`,
      )
      throw new Error(reason)
    }
    const { senderComUuid, senderGradidoId, messageUuid, body } = this.editParams
    if (
      !uuidv4Schema.safeParse(senderComUuid).success ||
      !uuidv4Schema.safeParse(senderGradidoId).success ||
      !uuidv4Schema.safeParse(messageUuid).success ||
      typeof body !== 'string' ||
      // Counted by code points: a pair of surrogates is one. The sending server's argument check
      // (class-validator) takes a variation selector for none as well, so it lets a text of
      // many such signs through that is refused here; the wallet's field counts code units and
      // is the strictest of the three, so nothing written there comes that far.
      Array.from(body).length > MESSAGE_MAX_CHARS
    ) {
      return refuse(EDIT_CHAT_MESSAGE_COMMAND_REFUSED.INVALID)
    }
    // Narrowed by the checks above; the schema's parse result is not what the compiler follows.
    const writer = { communityUuid: senderComUuid as string, gradidoId: senderGradidoId as string }
    const uuid = messageUuid as string
    let refusal: string | null
    try {
      refusal = await this.change(uuid, writer, body)
    } catch (error) {
      // ⛔ What the database throws stays here, as its code: a failed query carries its parameters
      // in its message, the text among them, and an error thrown out of a command is written to
      // this server's log and travels back in the answer (CommandExecutor).
      methodLogger.error(
        `chat message not edited: message_uuid=${uuid} (${databaseErrorCode(error)})`,
      )
      throw new Error(EDIT_CHAT_MESSAGE_COMMAND_REFUSED.NOT_STORED)
    }
    if (refusal !== null) {
      return refuse(refusal)
    }
    methodLogger.info(`chat message edited: message_uuid=${uuid} branch=incoming`)
    return EDIT_CHAT_MESSAGE_COMMAND_ANSWER
  }

  /** Checks who the command comes from and changes the message: null, or why it was not changed. */
  private async change(
    messageUuid: string,
    writer: ChatMemberRef,
    body: string,
  ): Promise<string | null> {
    if (!(await this.sealedByTheCommunityOf(writer.communityUuid))) {
      return EDIT_CHAT_MESSAGE_COMMAND_REFUSED.NOT_THE_WRITERS_COMMUNITY
    }
    // A caption may go where the picture stays (E-044); any other text may not be emptied.
    if (
      Array.from(body).length < MESSAGE_MIN_CHARS &&
      (await dbSelectChatMessageImageInfos([messageUuid])).length === 0
    ) {
      return EDIT_CHAT_MESSAGE_COMMAND_REFUSED.EMPTY
    }
    const changed = await dbUpdateChatMessageBody(messageUuid, writer, body)
    return changed.success ? null : EDIT_CHAT_MESSAGE_COMMAND_REFUSED.UNKNOWN_MESSAGE
  }

  /**
   * Whether the community that sealed the command is the one known here under `communityUuid`:
   * its public key is the key the envelope was opened with. False for a community not known
   * here, for a command that came without a key, and for a key that is none.
   */
  private async sealedByTheCommunityOf(communityUuid: string): Promise<boolean> {
    if (!this.requestingPublicKey) {
      return false
    }
    const community = await getCommunityByUuid(communityUuid)
    if (!community?.publicKey) {
      return false
    }
    try {
      return new Ed25519PublicKey(community.publicKey).isSame(
        new Ed25519PublicKey(this.requestingPublicKey),
      )
    } catch {
      return false
    }
  }
}
