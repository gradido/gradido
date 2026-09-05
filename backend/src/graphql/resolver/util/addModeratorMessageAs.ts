// AI-GENERATED — not an architecture reference
import { ContributionMessageType } from '@enum/ContributionMessageType'
import { sendAddedContributionMessageEmail } from 'core'
import {
  AppDatabase,
  Contribution as DbContribution,
  ContributionMessage as DbContributionMessage,
  User as DbUser,
} from 'database'
import { getLogger } from 'log4js'
import { EntityManager, FindOptionsRelations } from 'typeorm'

import { Role } from '@/auth/Role'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { PublishNameLogic } from '@/data/PublishName.logic'
import { EVENT_ADMIN_CONTRIBUTION_MESSAGE_CREATE } from '@/event/Events'
import { ContributionMessageArgs } from '@/graphql/arg/ContributionMessageArgs'
import { UpdateUnconfirmedContributionContext } from '@/interactions/updateUnconfirmedContribution/UpdateUnconfirmedContribution.context'
import { Context } from '@/server/context'
import { LogError } from '@/server/LogError'

import { contributionFrontendLink } from './contributions'

const db = AppDatabase.getInstance()

// Same log4js category as the resolver this was lifted out of, so the same lines keep
// arriving under the same name.
const createLogger = () =>
  getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.graphql.resolver.ContributionMessageResolver`)

/**
 * Writes a moderator message onto a contribution in `signer`'s name: a DIALOG message
 * moves the contribution to IN_PROGRESS and mails the author, a MODERATOR message is an
 * internal note and mails nobody.
 *
 * The signer is a parameter, not something read off the GraphQL context, so a caller that
 * comments in somebody else's name can say whose name that is.
 * `adminCreateContributionMessage` passes the logged-in moderator and is the only caller
 * today.
 *
 * Whether the signer is allowed to reach this contribution at all is the caller's
 * question — `adminCreateContributionMessage` answers it with
 * assertContributionInModeratorScope before it calls here.
 */
export const addModeratorMessageAs = async (
  contributionMessageArgs: ContributionMessageArgs,
  signer: DbUser,
  signerRole: Role,
  clientTimezoneOffset: number,
): Promise<DbContributionMessage> => {
  const logger = createLogger()
  const { contributionId, messageType } = contributionMessageArgs
  logger.addContext('contribution', contributionMessageArgs.contributionId)
  // UpdateUnconfirmedContributionContext takes its actor from a GraphQL Context: it reads
  // `user` and `role` in UpdateUnconfirmedContribution.context.ts and the timezone offset
  // through getClientTimezoneOffset in AbstractUnconfirmedContribution.role.ts. Acting in
  // somebody's name therefore means handing it a Context that carries that somebody.
  const signerContext: Context = {
    token: null,
    setHeaders: [],
    user: signer,
    role: signerRole,
    clientTimezoneOffset,
  }
  const updateUnconfirmedContributionContext = new UpdateUnconfirmedContributionContext(
    contributionId,
    contributionMessageArgs,
    signerContext,
  )
  const relations: FindOptionsRelations<DbContribution> =
    messageType === ContributionMessageType.DIALOG
      ? { user: { emailContact: true } }
      : { user: true }
  let finalContribution: DbContribution | undefined
  let finalContributionMessage: DbContributionMessage | undefined

  try {
    await db
      .getDataSource()
      .transaction('REPEATABLE READ', async (transactionalEntityManager: EntityManager) => {
        const { contribution, contributionMessage, contributionChanged } =
          await updateUnconfirmedContributionContext.run(transactionalEntityManager, relations)
        if (contributionChanged) {
          await transactionalEntityManager.update(
            DbContribution,
            { id: contributionId },
            contribution,
          )
          logger.debug(
            'contribution changed, resubmission at: %s, status: %s',
            contribution.resubmissionAt,
            contribution.contributionStatus,
          )
        }
        if (contributionMessage) {
          await transactionalEntityManager.insert(DbContributionMessage, contributionMessage)
        }
        finalContribution = contribution
        finalContributionMessage = contributionMessage
      })
  } catch (e) {
    throw new LogError(`ContributionMessage was not sent successfully: ${e}`, e)
  }
  if (!finalContribution || !finalContributionMessage) {
    throw new LogError('ContributionMessage was not sent successfully')
  }

  if (messageType === ContributionMessageType.DIALOG) {
    // send email (never for moderator messages)
    await sendAddedContributionMessageEmail({
      firstName: finalContribution.user.firstName,
      lastName: finalContribution.user.lastName,
      email: finalContribution.user.emailContact.email,
      language: finalContribution.user.language,
      senderAlias: new PublishNameLogic(signer).getPublicAlias(),
      contributionMemo: finalContribution.memo,
      contributionFrontendLink: await contributionFrontendLink(
        finalContribution.id,
        finalContribution.createdAt,
      ),
      message: finalContributionMessage.message,
    })
  }

  await EVENT_ADMIN_CONTRIBUTION_MESSAGE_CREATE(
    { id: finalContribution.userId } as DbUser,
    signer,
    finalContribution,
    finalContributionMessage,
  )
  return finalContributionMessage
}
