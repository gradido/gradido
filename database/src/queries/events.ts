import { ContributionLink as DbContributionLink, Event as DbEvent, User as DbUser } from '../entity'

export async function findModeratorCreatingContributionLink(
  contributionLink: DbContributionLink,
): Promise<DbUser | undefined> {
  const event = await DbEvent.findOne({
    where: {
      involvedContributionLinkId: contributionLink.id,
      // todo: move event types into db
      type: 'ADMIN_CONTRIBUTION_LINK_CREATE',
    },
    relations: { actingUser: true },
  })
  return event?.actingUser
}

/**
 * The most recent event of one type that concerns this member, or null.
 *
 * Used as a rate limit that survives the disappearance of the thing it guards: a pending
 * e-mail change is a row that gets deleted on cancel, so "when was the last mail sent"
 * cannot be read from it - the event stays.
 */
export async function dbFindLatestEventForAffectedUser(
  type: string,
  affectedUserId: number,
): Promise<DbEvent | null> {
  return DbEvent.findOne({
    // todo: move event types into db
    where: { type, affectedUserId },
    order: { createdAt: 'DESC' },
  })
}
