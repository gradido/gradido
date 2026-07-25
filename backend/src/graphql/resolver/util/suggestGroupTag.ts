import { Contribution as DbContribution } from 'database'
import { GroupTag } from '@/graphql/model/GroupTag'
import { attachContributionGroupTags, type GroupTaggable } from './attachContributionGroupTags'
import { loadUserGroupTags } from './userGroupTags'

// Group functions: what to pre-select in the group field when someone submits.
//
// The answer is DERIVED from the member's own history, never stored. Nothing to maintain,
// nothing to migrate, and it cannot go stale: whoever changes the group they contribute
// for gets the new one from their next submission on, and a group created later takes
// effect retroactively for an older "#tag" that used to name nothing.
//
// Walking backwards, newest first, each contribution is one of three things:
//   - it has a group                        -> a statement. Stop, suggest it.
//   - the group was set to "no group"       -> also a statement. Stop, suggest nothing.
//   - no stamp and no resolvable inline tag -> no statement. Keep walking.
//
// The middle case is what the group_tags_set_at stamp (migration 0108) is for: a
// deliberate "no group" has to be honoured, while a legacy contribution that simply never
// said anything must not silence an older, clear choice further back.
//
// Only when the whole history says nothing does the personal list's main tag apply — the
// seeding case ("the fire brigade signs ten people up"). A member's own choice therefore
// always outranks what a moderator entered for them; that is why the fallback sits last.
//
// The resolution itself is not re-derived here. attachContributionGroupTags is the one
// place that decides which group a contribution belongs to, shared with the display, the
// search and the moderator scope — those have drifted apart once already (LOG-029).
export const suggestGroupTagForUser = async (userId: number): Promise<GroupTag | null> => {
  // No cap on how far back this looks. A silent one would quietly break the promise for a
  // member with a long ungrouped history and one clear choice at the very beginning. Only
  // the three columns the resolution needs are selected, over that member's own rows.
  const rows = await DbContribution.find({
    select: { id: true, memo: true, groupTagsSetAt: true, createdAt: true },
    where: { userId },
    order: { createdAt: 'DESC', id: 'DESC' },
    withDeleted: true,
  })

  const contributions: GroupTaggable[] = rows.map((row) => ({
    id: row.id,
    memo: row.memo,
    groupTagsSetAt: row.groupTagsSetAt,
    groupTags: [],
  }))
  await attachContributionGroupTags(contributions)

  for (const contribution of contributions) {
    if (contribution.groupTags.length > 0) {
      return contribution.groupTags[0]
    }
    if (contribution.groupTagsSetAt !== null) {
      return null
    }
  }

  const personal = await loadUserGroupTags(userId)
  return personal[0] ? new GroupTag(personal[0]) : null
}
