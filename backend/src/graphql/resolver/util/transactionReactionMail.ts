// AI-GENERATED — not an architecture reference
import {
  chatMailWentOut,
  databaseErrorCode,
  readChatMemberMutedAt,
  sendTransactionReactionReceivedEmail,
} from 'core'
import {
  User as DbUser,
  dbFindDirectChatConversation,
  dbFindUserWithContactById,
  ReceivedTransfer,
} from 'database'
import { getLogger } from 'log4js'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { ReactionMailDecision, reactionMailDecision } from '@/data/TransactionReaction.logic'
import { getCommunityName } from './communities'

const createLogger = () =>
  getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.graphql.resolver.util.transactionReactionMail`)

export interface TransactionReactionMail {
  /** Whoever reacted: the recipient of the transfer, signed in. */
  recipientUser: DbUser
  /** Their RECEIVE row of the transfer, as the resolver read it before the write. */
  received: ReceivedTransfer
  /** The emoji set, or null where the reaction was taken back. */
  emoji: string | null
  /** Whether a reaction stood at the booking before this one. */
  hadReaction: boolean
}

/**
 * What became of the mail: the rule's answer (reactionMailDecision), NO_GIVER where the booking
 * names nobody here to mail, NOT_SENT where the mail was wanted and the transport did not take it.
 */
export type TransactionReactionMailOutcome = ReactionMailDecision | 'NO_GIVER' | 'NOT_SENT'

/**
 * Mails whoever sent the transfer -- the giver of the thank-you -- that the recipient reacted to
 * it, where the rule says so (reactionMailDecision, W1 "Dein Dank ist angekommen"): the first
 * reaction, by a recipient the giver did not mute, to a giver with an address. The mail names
 * the recipient by alias and community, carries the emoji, the amount and the memo of the
 * transfer, and a button into the conversation with the recipient.
 *
 * Called AFTER the reaction is stored, and awaited, as every mail of this server is
 * (chatMessageDelivery). The giver is loaded here, the mute mark read here, the rule asked
 * here: the resolver hands over what it read before the write (`hadReaction`), and nothing else
 * of the mail is its business.
 *
 * ⛔ Never throws, and changes nothing: the reaction stands, whatever becomes of the mail. A
 * giver that cannot be loaded, a read that fails, a transport that refuses -- all of it is
 * logged with the booking's id and the error's code, never its message (a failed statement
 * carries its values), and the mutation answers as it does without a mail. The log never gets
 * the emoji (the resolver's rule for the reaction) and never an address.
 *
 * Nothing is read for a reaction taken back or replaced: the rule answers those two without
 * the giver -- asked first as if the giver could be reached, and a no there stays a no.
 */
export async function notifyGiverOfReaction({
  recipientUser,
  received,
  emoji,
  hadReaction,
}: TransactionReactionMail): Promise<TransactionReactionMailOutcome> {
  const logger = createLogger()
  const where = `transaction_id=${received.id}`
  try {
    const withoutGiver = reactionMailDecision({
      emoji,
      hadReaction,
      giverMutedAt: null,
      giverHasAddress: true,
    })
    if (withoutGiver !== 'MAIL') {
      logger.debug(`transaction reaction mail not sent: ${where} ${withoutGiver}`)
      return withoutGiver
    }
    // A transfer booked here names its giver and its amount; a transfer from afar never gets
    // here (OTHER_COMMUNITY). Said rather than assumed, for a row this server did not write.
    if (received.senderUserId === null || received.amount === null) {
      logger.warn(`transaction reaction mail not sent: ${where} NO_GIVER`)
      return 'NO_GIVER'
    }
    // null for a giver without an address row, and for one who left (deleted_at).
    const giver = await dbFindUserWithContactById(received.senderUserId)
    const giverRef = giver
      ? { communityUuid: giver.communityUuid, gradidoId: giver.gradidoId }
      : null
    const recipientRef = {
      communityUuid: recipientUser.communityUuid,
      gradidoId: recipientUser.gradidoID,
    }
    // The giver's own mark on the conversation of the two (E-024); no conversation, no mark. A
    // read that fails counts as not muted, as the chat has it (readChatMemberMutedAt).
    const conversation = giverRef
      ? await dbFindDirectChatConversation(giverRef, recipientRef)
      : null
    const giverMutedAt =
      conversation && giverRef ? await readChatMemberMutedAt(conversation.id, giverRef) : null
    const decision = reactionMailDecision({
      emoji,
      hadReaction,
      giverMutedAt,
      giverHasAddress: Boolean(giver?.emailContact.email),
    })
    // The rule answered MAIL only with a giver and an emoji set -- said again for the types.
    if (decision !== 'MAIL' || !giver || emoji === null) {
      logger.info(`transaction reaction mail not sent: ${where} ${decision}`)
      return decision
    }
    const sent = await sendTransactionReactionReceivedEmail({
      firstName: giver.firstName ?? '',
      lastName: giver.lastName ?? '',
      email: giver.emailContact.email,
      language: giver.language,
      // The recipient as the mail names them to the giver: alias and community, no real name.
      recipientAlias: recipientUser.alias,
      recipientCommunity: await getCommunityName(recipientUser.communityUuid),
      emoji,
      transactionAmount: received.amount,
      transactionMemo: received.memo,
      // The button into the conversation with the recipient carries their pair.
      recipientUuid: recipientUser.gradidoID,
      recipientCommunityUuid: recipientUser.communityUuid,
    })
    // Sent only where the transport took it (chatMailWentOut): mail switched off, or refused, is no mail.
    if (!chatMailWentOut(sent)) {
      logger.warn(`transaction reaction mail not sent: ${where} NOT_SENT`)
      return 'NOT_SENT'
    }
    logger.info(`transaction reaction mail sent: ${where}`)
    return 'MAIL'
  } catch (error) {
    logger.error(`transaction reaction mail failed: ${where} (${databaseErrorCode(error)})`)
    return 'NOT_SENT'
  }
}
