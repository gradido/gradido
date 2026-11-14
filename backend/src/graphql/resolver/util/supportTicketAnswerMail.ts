// AI-GENERATED — not an architecture reference
import { chatMailWentOut, databaseErrorCode, sendAddedSupportTicketMessageEmail } from 'core'
import { dbFindUserWithContactById } from 'database'
import { getLogger } from 'log4js'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { type ModeratorMessageKind, supportAnswerMailDecision } from '@/data/SupportTicket.logic'

const createLogger = () =>
  getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.graphql.resolver.util.supportTicketAnswerMail`)

export interface SupportTicketAnswer {
  supportTicketId: number
  /** the member who owns the request */
  ownerId: number
  kind: ModeratorMessageKind
  /** the moderator's username, as the wallet's thread names them; null where they have none */
  moderatorAlias: string | null
  message: string
}

/**
 * What became of the mail: the rule's answer (supportAnswerMailDecision), NOT_SENT where the
 * mail was wanted and the transport did not take it, or where anything around it failed.
 */
export type SupportTicketAnswerMailOutcome =
  | ReturnType<typeof supportAnswerMailDecision>
  | 'NOT_SENT'

/**
 * Mails the member that a moderator answered their support request, where the rule says so
 * (supportAnswerMailDecision): an answer, with or without closing it, to a confirmed address --
 * never a note.
 *
 * Called AFTER the message is stored, and awaited. ⛔ Never throws and changes nothing: the answer
 * stands, whatever becomes of the mail, and the moderator's write answers alike with and without
 * one -- a mail that failed must not make the moderator send the answer a second time. The log
 * gets the request's number and an error's code, never the words, an address or a name.
 */
export async function mailMemberOfSupportAnswer({
  supportTicketId,
  ownerId,
  kind,
  moderatorAlias,
  message,
}: SupportTicketAnswer): Promise<SupportTicketAnswerMailOutcome> {
  const logger = createLogger()
  const where = `support_ticket_id=${supportTicketId}`
  try {
    // Nothing is read for a note. Null for an account gone and for one without an address in force.
    const member = kind === 'NOTE' ? null : await dbFindUserWithContactById(ownerId)
    const decision = supportAnswerMailDecision(kind, member)
    // the rule answered MAIL only with a member -- said again for the types
    if (decision !== 'MAIL' || !member) {
      logger.info(`support answer mail not sent: ${where} ${decision}`)
      return decision
    }
    const sent = await sendAddedSupportTicketMessageEmail({
      firstName: member.firstName ?? '',
      lastName: member.lastName ?? '',
      email: member.emailContact.email,
      language: member.language,
      moderatorAlias,
      supportTicketNumber: supportTicketId,
      message,
      closed: kind === 'ANSWER_AND_CLOSE',
    })
    // Sent only where the transport took it (chatMailWentOut): mail switched off, or refused, is no mail.
    if (!chatMailWentOut(sent)) {
      logger.warn(`support answer mail not sent: ${where} NOT_SENT`)
      return 'NOT_SENT'
    }
    logger.info(`support answer mail sent: ${where}`)
    return 'MAIL'
  } catch (error) {
    logger.error(`support answer mail failed: ${where} (${databaseErrorCode(error)})`)
    return 'NOT_SENT'
  }
}
