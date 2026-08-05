// Group functions: "group tag" becomes "creation group" everywhere -- entities, GraphQL,
// rights, locale keys, routes, filenames -- and the schema follows.
//
// The name came from Dario: "group" on its own is ambiguous and will get more so, since a
// chat brings groups of its own and Gradido already has its circles. These groups are the
// ones a creation belongs to, hence "creation group".
//
// ★ Why a rename migration at all, rather than editing 0108 to create the new names:
// no release contains 0108 yet, so production has never seen these tables -- but the
// staging system and every developer database ran it long ago, and an edited migration
// does not run again for them. Editing it would leave those databases on the old names
// with code that expects the new ones, silently.
//
// What this renames, and nothing else -- exactly the objects 0108 created:
//   3 tables, 4 columns, 7 indices.
// The two columns 0109 added (hashtags_adopted_at / hashtags_adopted_count) carry no group
// wording and correctly stay as they are.
//
// ⚠️ Order matters. Columns first, while the tables still answer to their old names; then
// the tables; then the indices, addressed through the NEW table names. The downgrade walks
// the exact inverse.

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // --- columns, while the tables are still called what 0108 called them
  await queryFn(
    'ALTER TABLE `user_roles` RENAME COLUMN `visible_group_tags` TO `visible_creation_groups`;',
  )
  await queryFn(
    'ALTER TABLE `contributions` RENAME COLUMN `group_tags_set_at` TO `creation_groups_set_at`;',
  )
  await queryFn(
    'ALTER TABLE `contribution_group_tags` RENAME COLUMN `group_tag_id` TO `creation_group_id`;',
  )
  await queryFn(
    'ALTER TABLE `user_group_tags` RENAME COLUMN `group_tag_id` TO `creation_group_id`;',
  )

  // --- tables
  await queryFn('ALTER TABLE `group_tags` RENAME TO `creation_groups`;')
  await queryFn('ALTER TABLE `contribution_group_tags` RENAME TO `contribution_creation_groups`;')
  await queryFn('ALTER TABLE `user_group_tags` RENAME TO `user_creation_groups`;')

  // --- indices, through the new table names. Renamed rather than left alone on purpose:
  // an index called idx_cgt_group_tag_id sitting on a table called contribution_creation_groups
  // is a trap for whoever reads the schema next.
  await queryFn(
    'ALTER TABLE `creation_groups` RENAME INDEX `uniq_group_tags_tag` TO `uniq_creation_groups_tag`;',
  )
  await queryFn(
    'ALTER TABLE `contribution_creation_groups` RENAME INDEX `uniq_contribution_group_tag` TO `uniq_contribution_creation_group`;',
  )
  await queryFn(
    'ALTER TABLE `contribution_creation_groups` RENAME INDEX `idx_cgt_contribution_id` TO `idx_ccg_contribution_id`;',
  )
  await queryFn(
    'ALTER TABLE `contribution_creation_groups` RENAME INDEX `idx_cgt_group_tag_id` TO `idx_ccg_creation_group_id`;',
  )
  await queryFn(
    'ALTER TABLE `user_creation_groups` RENAME INDEX `uniq_user_group_tag` TO `uniq_user_creation_group`;',
  )
  await queryFn(
    'ALTER TABLE `user_creation_groups` RENAME INDEX `idx_ugt_user_id` TO `idx_ucg_user_id`;',
  )
  await queryFn(
    'ALTER TABLE `user_creation_groups` RENAME INDEX `idx_ugt_group_tag_id` TO `idx_ucg_creation_group_id`;',
  )
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // --- indices first, through the still-new table names
  await queryFn(
    'ALTER TABLE `user_creation_groups` RENAME INDEX `idx_ucg_creation_group_id` TO `idx_ugt_group_tag_id`;',
  )
  await queryFn(
    'ALTER TABLE `user_creation_groups` RENAME INDEX `idx_ucg_user_id` TO `idx_ugt_user_id`;',
  )
  await queryFn(
    'ALTER TABLE `user_creation_groups` RENAME INDEX `uniq_user_creation_group` TO `uniq_user_group_tag`;',
  )
  await queryFn(
    'ALTER TABLE `contribution_creation_groups` RENAME INDEX `idx_ccg_creation_group_id` TO `idx_cgt_group_tag_id`;',
  )
  await queryFn(
    'ALTER TABLE `contribution_creation_groups` RENAME INDEX `idx_ccg_contribution_id` TO `idx_cgt_contribution_id`;',
  )
  await queryFn(
    'ALTER TABLE `contribution_creation_groups` RENAME INDEX `uniq_contribution_creation_group` TO `uniq_contribution_group_tag`;',
  )
  await queryFn(
    'ALTER TABLE `creation_groups` RENAME INDEX `uniq_creation_groups_tag` TO `uniq_group_tags_tag`;',
  )

  // --- tables
  await queryFn('ALTER TABLE `user_creation_groups` RENAME TO `user_group_tags`;')
  await queryFn('ALTER TABLE `contribution_creation_groups` RENAME TO `contribution_group_tags`;')
  await queryFn('ALTER TABLE `creation_groups` RENAME TO `group_tags`;')

  // --- columns, once the tables answer to their old names again
  await queryFn(
    'ALTER TABLE `user_group_tags` RENAME COLUMN `creation_group_id` TO `group_tag_id`;',
  )
  await queryFn(
    'ALTER TABLE `contribution_group_tags` RENAME COLUMN `creation_group_id` TO `group_tag_id`;',
  )
  await queryFn(
    'ALTER TABLE `contributions` RENAME COLUMN `creation_groups_set_at` TO `group_tags_set_at`;',
  )
  await queryFn(
    'ALTER TABLE `user_roles` RENAME COLUMN `visible_creation_groups` TO `visible_group_tags`;',
  )
}
