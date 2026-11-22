// AI-GENERATED — not an architecture reference

import type { HandledCreationGroups } from './CreationGroup.schema'

/**
 * The answer of adminOpenCreationCounts: four counts of the same field, under aliases -- three in
 * "Meine Gruppen" (MG1), one over everything open -- and the choice.
 */
export type OpenCreationCounts = Record<
  'waitingForModeration' | 'waitingForMember' | 'allOpen' | 'everythingOpen',
  { contributionCount: number }
> & { handledCreationGroups: HandledCreationGroups }

/**
 * What is open: waiting for the moderation or for the member -- what the tab "open" of the
 * creation page shows --, and besides that what is put off to a resubmission date. The counts are
 * statements of their own, so a creation changing between them could make a rest less than nothing.
 *
 * `elsewhere`: what is open outside "Meine Gruppen", only where something is chosen. Without a
 * choice the counts take everything, and a creation arriving between them must not make up a line.
 * `off` (MG5): the administrator handles no creations, and the page says nothing of them.
 */
export const openCreationsOf = ({
  waitingForModeration,
  waitingForMember,
  allOpen,
  everythingOpen,
  handledCreationGroups,
}: OpenCreationCounts) => {
  const forModeration = waitingForModeration.contributionCount
  const forMember = waitingForMember.contributionCount
  const open = forModeration + forMember
  const chose = handledCreationGroups.groupIds.length > 0 || handledCreationGroups.untagged
  return {
    forModeration,
    forMember,
    open,
    onResubmission: Math.max(allOpen.contributionCount - open, 0),
    elsewhere: chose ? Math.max(everythingOpen.contributionCount - open, 0) : 0,
    off: handledCreationGroups.off,
  }
}
