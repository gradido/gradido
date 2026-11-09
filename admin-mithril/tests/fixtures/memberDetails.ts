// AI-GENERATED — not an architecture reference

export const creationGroups = [
  { id: 1, tag: 'garden', name: 'Garten', hashtagsAdoptedAt: null, hashtagsAdoptedCount: 0 },
  { id: 2, tag: 'bakery', name: null, hashtagsAdoptedAt: null, hashtagsAdoptedCount: 0 },
]

/**
 * What the tabs of an open row ask for, all of it empty: the old admin asks for every tab as the
 * row opens, the Mithril admin for the tab it shows.
 */
export const memberDetailsAnswers = {
  adminOpenCreations: [],
  adminEmailStatus: {
    gdtEmail: null,
    currentConfirmed: true,
    elopageBuysOnCurrent: false,
    pendingEmail: null,
    pendingSince: null,
  },
  adminListContributions: { contributionCount: 0, contributionList: [] },
  listTransactionLinksAdmin: { count: 0, links: [] },
  creationGroups,
  userCreationGroups: [creationGroups[0]],
  moderatorCreationGroupScope: ['*untagged', 'garden'],
}
