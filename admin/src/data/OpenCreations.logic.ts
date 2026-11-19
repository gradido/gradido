// AI-GENERATED — not an architecture reference

/** The answer of adminOpenCreationCounts: three counts of the same field, under aliases. */
export type OpenCreationCounts = Record<
  'waitingForModeration' | 'waitingForMember' | 'allOpen',
  { contributionCount: number }
>

/**
 * What is open: waiting for the moderation or for the member -- what the tab "open" of the
 * creation page shows --, and besides that what is put off to a resubmission date. The counts are
 * three statements, so a creation changing between them could make that rest less than nothing.
 */
export const openCreationsOf = ({
  waitingForModeration,
  waitingForMember,
  allOpen,
}: OpenCreationCounts) => {
  const forModeration = waitingForModeration.contributionCount
  const forMember = waitingForMember.contributionCount
  const open = forModeration + forMember
  return {
    forModeration,
    forMember,
    open,
    onResubmission: Math.max(allOpen.contributionCount - open, 0),
  }
}
