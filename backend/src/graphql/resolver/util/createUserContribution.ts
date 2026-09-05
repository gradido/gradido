// AI-GENERATED — not an architecture reference
import { ContributionArgs } from '@arg/ContributionArgs'
import { ContributionStatus } from '@enum/ContributionStatus'
import { ContributionType } from '@enum/ContributionType'
import { Contribution as DbContribution, User as DbUser } from 'database'
import { getLogger } from 'log4js'

import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { EVENT_CONTRIBUTION_CREATE } from '@/event/Events'

import {
  linkContributionCreationGroups,
  resolveContributionCreationGroups,
} from './contributionCreationGroups'
import { getUserCreation, validateContribution } from './creations'

// Same log4js category as the resolver this was lifted out of, so the same lines keep
// arriving under the same name.
const createLogger = () =>
  getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.graphql.resolver.ContributionResolver`)

/**
 * Files a USER contribution in `user`'s name.
 *
 * The author is a parameter, not something read off the GraphQL context, so a caller that
 * is not the logged-in person can file one too. `createContribution` passes the logged-in
 * user and is the only caller today.
 */
export const createUserContribution = async (
  user: DbUser,
  { amount, memo, contributionDate, creationGroups }: ContributionArgs,
  clientTimezoneOffset: number,
): Promise<DbContribution> => {
  const creations = await getUserCreation(user.id, clientTimezoneOffset)
  const logger = createLogger()
  logger.addContext('user', user.id)
  logger.trace('creations', creations)
  const contributionDateObj = new Date(contributionDate)
  validateContribution(creations, amount, contributionDateObj, clientTimezoneOffset)

  // Group functions: resolved before the row exists, so a lookup that fails leaves no
  // half-written contribution behind.
  const canonicalGroups = await resolveContributionCreationGroups(creationGroups ?? [])

  const contribution = DbContribution.create()
  contribution.userId = user.id
  contribution.amount = amount
  contribution.createdAt = new Date()
  contribution.contributionDate = contributionDateObj
  contribution.memo = memo
  contribution.contributionType = ContributionType.USER
  contribution.contributionStatus = ContributionStatus.PENDING
  // Group functions: stamped on the entity, the same way adminCreateContribution does it,
  // and for the same reason. A row on its way in has no links to replace and no stamp to
  // correct, so setContributionCreationGroups would spend a delete that can never match
  // plus an update on the row inserted one statement earlier. The stamp is written whether
  // or not a group was chosen -- that is what tells "deliberately no group" apart from
  // "never said anything".
  contribution.creationGroupsSetAt = new Date()

  logger.trace('contribution to save', contribution)
  await DbContribution.save(contribution)
  await linkContributionCreationGroups(contribution.id, canonicalGroups)
  await EVENT_CONTRIBUTION_CREATE(user, contribution, amount)

  return contribution
}
