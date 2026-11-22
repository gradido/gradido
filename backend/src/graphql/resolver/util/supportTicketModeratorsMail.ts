// AI-GENERATED — not an architecture reference
import { chatMailWentOut, databaseErrorCode, sendNewSupportTicketEmail } from 'core'
import { dbSelectRoleHoldersWithContact, RoleHolderWithContact, RoleNames } from 'database'
import { getLogger } from 'log4js'
import { RIGHTS } from '@/auth/RIGHTS'
import { roleOfHolder } from '@/auth/ROLES'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { supportTicketMailRecipients, supportTicketMailsAllowed } from '@/data/SupportTicket.logic'
import {
  describeModeratorCreationGroups,
  handledSupportGroupsOfRole,
} from './moderatorCreationGroupScope'

const createLogger = () =>
  getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.graphql.resolver.util.supportTicketModeratorsMail`)

/**
 * Who hears of a request by mail (SUA-018, SUA-024) -- a new one, or one handed on to the group of
 * `groupTag` (null: no group): the members with a role, in one query, each with their scope as
 * describeModeratorCreationGroups reads it, through the rule (supportTicketMailRecipients).
 * Whether a member may handle requests is asked of the right MANAGE_SUPPORT_TICKETS of their row
 * as isAuthorized reads it (roleOfHolder: an administrator always, a moderator with the tick of
 * K6), not of the name of the role; nobody in `notFor` -- the asking member, who handed on -- gets
 * a mail.
 *
 * Read before the request is filed or handed on, and awaited: what follows the write without
 * being waited for is the sending alone. ⛔ Never throws: where the reading fails, nobody is
 * mailed, the log gets the error's code, and the request goes on.
 */
export async function readSupportTicketMailRecipients(
  groupTag: string | null,
  notFor: number[],
): Promise<RoleHolderWithContact[]> {
  try {
    const holders = await dbSelectRoleHoldersWithContact()
    return supportTicketMailRecipients(
      holders.map((holder) => ({
        ...holder,
        ...describeModeratorCreationGroups(holder),
        id: holder.userId,
        handlesSupportTickets: roleOfHolder(holder).hasRight(RIGHTS.MANAGE_SUPPORT_TICKETS),
        isAdmin: holder.role === RoleNames.ADMIN,
        supportOff: handledSupportGroupsOfRole(holder)?.off === true,
      })),
      groupTag,
      notFor,
    )
  } catch (error) {
    createLogger().error(`support moderators not read (${databaseErrorCode(error)})`)
    return []
  }
}

/** When requests of this process started mails, for the cap: forgotten on a restart. */
let mailedAt: number[] = []

export interface SupportTicketModeratorsMail {
  supportTicketId: number
  recipients: RoleHolderWithContact[]
  /** the username of who asked, or of who handed on; null where they have none */
  actorAlias: string | null
  /** the request's group by its name (supportTicketGroupName), null for none */
  groupName: string | null
  reassigned: boolean
}

/**
 * Mails the moderators readSupportTicketMailRecipients found, one after the other, each in their
 * language: who asked or handed on, the request's number and its group -- never a word of the
 * request (SUA-024, point 4). A mail that fails does not hold up the next one. Where
 * SUPPORT_TICKET_MAILED_PER_HOUR_MAX requests of the hour before started mails, this one mails
 * nobody (point 7): the counts in the admin show it.
 *
 * ⛔ Not waited for: the request calls it with `void` once the write is done, so it reads no row
 * and never rejects. The log gets the request's number, how many mails went out and an error's
 * code -- never a name, an address or a group's name.
 */
export async function mailModeratorsOfSupportTicket({
  supportTicketId,
  recipients,
  actorAlias,
  groupName,
  reassigned,
}: SupportTicketModeratorsMail): Promise<void> {
  const logger = createLogger()
  const where = `support_ticket_id=${supportTicketId}`
  if (recipients.length === 0) {
    logger.info(`support moderators mail: ${where} nobody to mail`)
    return
  }
  const cap = supportTicketMailsAllowed(mailedAt, Date.now())
  mailedAt = cap.mailedAt
  if (!cap.allowed) {
    logger.warn(`support moderators mail not sent: ${where} hourly cap reached`)
    return
  }
  let sent = 0
  for (const recipient of recipients) {
    try {
      const result = await sendNewSupportTicketEmail({
        firstName: recipient.firstName ?? '',
        lastName: recipient.lastName ?? '',
        email: recipient.email,
        language: recipient.language,
        actorAlias,
        supportTicketNumber: supportTicketId,
        groupName,
        reassigned,
      })
      if (chatMailWentOut(result)) {
        sent += 1
      }
    } catch (error) {
      logger.error(`support moderators mail failed: ${where} (${databaseErrorCode(error)})`)
    }
  }
  logger.info(`support moderators mail: ${where} sent=${sent} of ${recipients.length}`)
}
