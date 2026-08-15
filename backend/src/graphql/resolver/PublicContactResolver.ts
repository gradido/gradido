// AI-GENERATED — not an architecture reference
import { PublicContactArgs } from '@arg/PublicContactArgs'
import { sendContactFromProfileEmail } from 'core'
import { findUserByIdentifier, getHomeCommunity } from 'database'
import { getLogger } from 'log4js'
import { aliasSchema, uuidv4Schema } from 'shared'
import { Args, Authorized, Ctx, Mutation, Resolver } from 'type-graphql'
import { RIGHTS } from '@/auth/RIGHTS'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { publicContactRateLimit } from '@/data/PublicContactRateLimit'
import { Context } from '@/server/context'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.graphql.resolver.PublicContactResolver`)

/**
 * Counted, not kept: one line per message that found nobody.
 *
 * A message to an alias that does not exist is thrown away (PS-008). It is still counted,
 * because in a few weeks the number answers a question nobody has to decide today: are
 * there people behind these, or machines? The line carries no content, no address and no
 * alias - it is a tally mark, and grepping for the marker gives the number per day.
 */
const MISS_MARKER = 'PUBLIC_CONTACT_MISS'

/**
 * Whoever cannot be reached this way, and why it is not a detail.
 *
 * `findUserByIdentifier` also resolves an e-mail address, and for a logged-in member that
 * is right. Behind a public form it would turn the Gradido address into two things it must
 * never be: a way to mail anybody whose address you already have, through our server and
 * under our sender - and a way to ask whether an address belongs to a Gradido account.
 * A stranger may name the alias out of the address, or the Gradido ID that stands in for
 * one where an account has no user name yet. Nothing else.
 */
const isContactableIdentifier = (identifier: string): boolean =>
  uuidv4Schema.safeParse(identifier).success || aliasSchema.safeParse(identifier).success

/**
 * Looks the recipient up and hands the message over - after the visitor has been answered.
 *
 * Exported for the tests, and because everything here has to be able to fail without
 * anybody outside noticing.
 */
export const deliverPublicContactMessage = async (args: PublicContactArgs): Promise<void> => {
  try {
    if (!isContactableIdentifier(args.recipientIdentifier)) {
      logger.info(MISS_MARKER)
      return
    }
    const homeCommunity = await getHomeCommunity()
    if (!homeCommunity?.communityUuid) {
      logger.error('no home community, cannot deliver a public contact message')
      return
    }
    // Bound to this community on purpose: a Gradido address names the community in its host
    // part, so whoever opens one is asking this server about one of its own members. The rows
    // that federation keeps for members elsewhere must not answer here.
    const recipient = await findUserByIdentifier(
      args.recipientIdentifier,
      homeCommunity.communityUuid,
    )
    // `foreign` is a copy of a member of another community, held for federation; that member
    // is reachable through their own community's address, not through ours.
    if (!recipient || recipient.foreign || !recipient.emailContact) {
      logger.info(MISS_MARKER)
      return
    }
    await sendContactFromProfileEmail({
      firstName: recipient.firstName,
      lastName: recipient.lastName,
      email: recipient.emailContact.email,
      language: recipient.language,
      senderName: args.senderName,
      senderEmail: args.senderEmail,
      subject: args.subject,
      message: args.message,
    })
  } catch (error) {
    // Without content and without either address: this line exists so that a broken mail
    // path is visible at all, not so that anybody can read along.
    logger.error('sending a public contact message failed', error)
  }
}

@Resolver()
export class PublicContactResolver {
  /**
   * The contact form behind a Gradido address, for somebody who has no account.
   *
   * ## It always says the same thing
   *
   * `true`, every time: to a member, to an alias nobody has, to a bot that tripped the
   * honeypot, and to an origin that has written too often. From outside there is nothing
   * to tell apart - which is the whole point (E-010), and a contact form never confirms
   * delivery anyway.
   *
   * ## And it answers before it does anything
   *
   * Looking the recipient up costs a query, and handing the mail over costs a little more;
   * a caller with a stopwatch could tell a member from a stranger by the difference alone.
   * So the answer goes out first and the work happens afterwards. Nothing the visitor can
   * measure depends on who they asked for.
   */
  @Authorized([RIGHTS.SEND_PUBLIC_CONTACT_MESSAGE])
  @Mutation(() => Boolean)
  sendPublicContactMessage(@Args() args: PublicContactArgs, @Ctx() context: Context): boolean {
    const originAllowed = publicContactRateLimit.allow(context.clientIp ?? 'unknown')
    const looksHuman = !args.website
    if (originAllowed && looksHuman) {
      // Not awaited on purpose - see the comment above. Nothing is thrown out of the
      // delivery either; it swallows its own failures, because they belong to nobody here.
      setImmediate(() => {
        deliverPublicContactMessage(args).catch((error) => {
          logger.error('a public contact message escaped its own catch', error)
        })
      })
    }
    return true
  }
}
