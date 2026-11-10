// AI-GENERATED — not an architecture reference
import { creationGroupOption } from '@admin/utils/creationGroupLabel'
import type { Option } from '@/components/ThemedSelect'
import type { Moderator } from '@/data/Moderator.schema'
import { t } from '@/i18n'
import type { ListedContribution } from './Contribution.schema'

type CreationGroup = { tag: string; name: string | null }

/** Still being worked on: a moderator can still decide it. */
export const isOpen = ({ contributionStatus }: ListedContribution) =>
  contributionStatus === 'PENDING' || contributionStatus === 'IN_PROGRESS'

/**
 * Where a saved resubmission is offered for the others on the list: only where the list shows one
 * member alone, with more than one open contribution -- nobody else's are ever touched -- and where
 * there is something to spread: a date, or a real save (a removal spreads the clearing).
 */
export const offersBulkResubmission = (
  contributions: ListedContribution[],
  saved: { resubmissionAt: string | null; unchanged: boolean },
) =>
  (saved.resubmissionAt !== null || !saved.unchanged) &&
  new Set(contributions.map(({ userId }) => userId)).size === 1 &&
  contributions.filter(isOpen).length > 1

/** The colour of a contribution's row, by its state. */
export const rowTone = ({ contributionStatus }: ListedContribution) =>
  ({
    PENDING: 'table-primary',
    IN_PROGRESS: 'table-primary',
    CONFIRMED: 'table-success',
    DENIED: 'table-warning',
    DELETED: 'table-danger',
  })[contributionStatus]

export type DetailsState = 'question' | 'note' | 'answer' | 'changed' | 'conversation' | null

/**
 * What is going on with a contribution, for its details button. In progress -- only a question to
 * the member makes it that: the question waits, or a colleague's note on it. Open, and the member
 * had the last word: their answer, or their change, which leaves a history entry. A conversation
 * with nothing waiting in it. Or no conversation at all.
 */
export const detailsState = (contribution: ListedContribution): DetailsState => {
  if (contribution.contributionStatus === 'IN_PROGRESS') {
    return contribution.colleagueNoteOnQuestion ? 'note' : 'question'
  }
  if (
    contribution.contributionStatus === 'PENDING' &&
    contribution.lastMessageByModerator === false
  ) {
    return contribution.lastMessageType === 'HISTORY' ? 'changed' : 'answer'
  }
  return contribution.lastMessageType !== null ? 'conversation' : null
}

const CLOSED_BY: Record<string, string> = {
  CONFIRMED: 'contribution.confirmedBy',
  DENIED: 'contribution.deniedBy',
  DELETED: 'contribution.deletedBy',
}

/** Who closed, changed and entered a contribution, as a line below its text; '' where nobody. */
export const memoComment = (contribution: ListedContribution) =>
  [
    (contribution.closedBy ?? 0) > 0 && CLOSED_BY[contribution.contributionStatus]
      ? t(CLOSED_BY[contribution.contributionStatus], { name: contribution.closedByUserName ?? '' })
      : '',
    (contribution.updatedBy ?? 0) > 0
      ? t('moderator.memo-modified', { name: contribution.updatedByUserName ?? '' })
      : '',
    (contribution.moderatorId ?? 0) > 0
      ? t('contribution.createdBy', { name: contribution.moderatorUserName ?? '' })
      : '',
  ]
    .filter(Boolean)
    .join(' | ')

/**
 * The choices of the group filter. Whoever sees every group: everything, everything in some group,
 * everything in none -- the two `*…` are tokens the server reserves -- and each group. A moderator
 * scoped to groups: all of theirs, the ungrouped where the scope covers them, and each of theirs;
 * scoped to no group, the ungrouped alone.
 */
export const groupFilterOptions = (
  moderator: Pick<Moderator, 'seesAllCreationGroups' | 'visibleCreationGroups' | 'seesUntagged'>,
  groups: CreationGroup[],
): Option[] => {
  const untagged = { value: '*untagged', text: t('creationGroupFilter.untagged') }
  const grouped = { value: '*grouped', text: t('creationGroupFilter.grouped') }
  if (moderator.seesAllCreationGroups) {
    return [
      { value: '', text: t('creationGroupFilter.all') },
      grouped,
      untagged,
      ...groups.map(creationGroupOption),
    ]
  }
  if (moderator.visibleCreationGroups.length === 0) {
    return [untagged]
  }
  return [
    grouped,
    ...(moderator.seesUntagged ? [untagged] : []),
    ...groups
      .filter((group) => moderator.visibleCreationGroups.includes(group.tag))
      .map(creationGroupOption),
  ]
}
