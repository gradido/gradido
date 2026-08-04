// LEGACY-HASHTAG-ADOPTION -- a changeover aid, meant to be removed again.
// Group functions: remember, per group, whether the hashtags that predate the group field
// have been looked at.
//
// Before the field existed, a "#word" in the memo was the only way to name a group. That
// stock cannot be converted by a migration: group_tags is empty at the moment the group
// tables are created, so there is nothing an inline hashtag could refer to yet, and a
// migration gets one attempt. It is adopted per group from the admin instead -- the first
// point at which the canonical list exists.
//
// Which makes "has this group been dealt with?" a fact worth storing. Deriving it from the
// group's age would be a poor stand-in: every group that exists today was created before
// the adoption did, so the answer has to be recorded rather than guessed.
//
// NULL means never looked at, which is exactly right for every group that exists today.

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    'ALTER TABLE `group_tags` ADD COLUMN `hashtags_adopted_at` datetime(3) NULL DEFAULT NULL;',
  )
  // How many contributions the last run adopted. Kept next to the timestamp so the group
  // list can say what happened without reading the memos again.
  await queryFn(
    'ALTER TABLE `group_tags` ADD COLUMN `hashtags_adopted_count` int unsigned NULL DEFAULT NULL;',
  )
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('ALTER TABLE `group_tags` DROP COLUMN `hashtags_adopted_count`;')
  await queryFn('ALTER TABLE `group_tags` DROP COLUMN `hashtags_adopted_at`;')
}
