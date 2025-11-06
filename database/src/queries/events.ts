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
