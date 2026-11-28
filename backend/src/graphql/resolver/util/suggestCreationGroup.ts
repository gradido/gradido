import { dbSelectNewestCreationGroupStatement } from 'database'
import { CreationGroup } from '@/graphql/model/CreationGroup'
import { loadUserCreationGroups } from './userCreationGroups'

// Group functions: what to pre-select in the group field when someone submits.
//
// The answer is DERIVED from the member's own history, never stored. Nothing to maintain,
// nothing that can go stale: whoever changes the group they contribute for gets the new one
// from their next submission on.
//
// Wanted is the newest contribution that MADE A STATEMENT. A contribution makes a statement
// when it is linked to a group, or when the group field was used to say "no group" — the
// creation_groups_set_at stamp. Everything in between (old stock that never used the field) says
// nothing and is skipped.
//
// That is one row, and the database finds it (dbSelectNewestCreationGroupStatement): ORDER BY
// ... LIMIT 1 over idx_contributions_user_created. The earlier version loaded the member's
// ENTIRE history into TypeScript and walked it there, which was a full table scan per
// submission form -- contributions had no index on user_id at all.
//
// Deleted contributions count, as they did before: they stay visible to their author in
// "my contributions", so they are still that member's own statement. The query has no
// soft-delete filter, and it must not grow one.
export const suggestCreationGroupForUser = async (
  userId: number,
): Promise<CreationGroup | null> => {
  const statement = await dbSelectNewestCreationGroupStatement(userId)
  if (statement) {
    // A group -> suggest it. Only the stamp -> the member said "no group" on purpose, and
    // that is honoured rather than reaching further back for an older choice.
    return statement.group ? new CreationGroup(statement.group) : null
  }

  // The whole history says nothing: the seeding case ("the fire brigade signs ten people
  // up"). Only then does the personal list's main tag apply, so a member's own choice always
  // outranks what a moderator entered for them.
  const personal = await loadUserCreationGroups(userId)
  return personal[0] ? new CreationGroup(personal[0]) : null
}
