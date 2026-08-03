import { AppDatabase, GroupTag as DbGroupTag } from 'database'
import { GroupTag } from '@/graphql/model/GroupTag'
import { loadUserGroupTags } from './userGroupTags'

// Group functions: what to pre-select in the group field when someone submits.
//
// The answer is DERIVED from the member's own history, never stored. Nothing to maintain,
// nothing that can go stale: whoever changes the group they contribute for gets the new one
// from their next submission on.
//
// Wanted is the newest contribution that MADE A STATEMENT. A contribution makes a statement
// when it is linked to a group, or when the group field was used to say "no group" — the
// group_tags_set_at stamp. Everything in between (old stock that never used the field) says
// nothing and is skipped.
//
// That is one row, and the database finds it: ORDER BY ... LIMIT 1 over
// idx_contributions_user_created. The earlier version loaded the member's ENTIRE history
// into TypeScript and walked it there, which was a full table scan per submission form —
// contributions had no index on user_id at all.
//
// Deleted contributions count, as they did before: they stay visible to their author in
// "my contributions", so they are still that member's own statement. Raw SQL has no
// soft-delete filter, so this needs nothing extra — but it also must not grow one.
//
// A contribution linked to more than one group yields one row per link; gt.tag decides
// which comes first, so the answer does not depend on physical row order.
const NEWEST_STATEMENT_SQL = `
  SELECT gt.id AS id, gt.tag AS tag, gt.name AS name
    FROM contributions c
    LEFT JOIN contribution_group_tags cgt ON cgt.contribution_id = c.id
    LEFT JOIN group_tags gt ON gt.id = cgt.group_tag_id
   WHERE c.user_id = ?
     AND (c.group_tags_set_at IS NOT NULL OR cgt.id IS NOT NULL)
   ORDER BY c.created_at DESC, c.id DESC, gt.tag ASC
   LIMIT 1`

export const suggestGroupTagForUser = async (userId: number): Promise<GroupTag | null> => {
  const rows: Array<{ id: number | null; tag: string | null; name: string | null }> =
    await AppDatabase.getInstance().getDataSource().query(NEWEST_STATEMENT_SQL, [userId])

  if (rows.length > 0) {
    const row = rows[0]
    // A group -> suggest it. Only the stamp -> the member said "no group" on purpose, and
    // that is honoured rather than reaching further back for an older choice.
    if (row.id === null || row.tag === null) {
      return null
    }
    return new GroupTag(DbGroupTag.create({ id: row.id, tag: row.tag, name: row.name }))
  }

  // The whole history says nothing: the seeding case ("the fire brigade signs ten people
  // up"). Only then does the personal list's main tag apply, so a member's own choice always
  // outranks what a moderator entered for them.
  const personal = await loadUserGroupTags(userId)
  return personal[0] ? new GroupTag(personal[0]) : null
}
