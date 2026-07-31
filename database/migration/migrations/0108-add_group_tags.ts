// Group functions: structured group tags for common-good contributions, replacing the
// fragile "inline #hashtag in the memo" convention.
//
// Adds:
//   - group_tags: the canonical list of valid tags (admin-managed).
//   - contribution_group_tags: a contribution can carry several tags.
//   - user_group_tags: a user's personal tag list; the lowest sort_order is the
//     "main tag", pre-filled in the group-tag field on submission.
//   - user_roles.visible_group_tags: a moderator's visibility scope.
//   - contributions.group_tags_set_at: tells "deliberately no group" apart from
//     "never said anything", which is what the submission pre-fill asks for.
//   - an index on contributions (user_id, created_at): every per-member query needs it,
//     and there was none — not even on user_id alone.
//
// The existing inline hashtags are converted once, in 0109. From then on a "#word" in a
// memo is ordinary text; the group field is the only way to set a group.
// No FK constraints (matches the crea_records convention) — indices only.

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // Canonical list of valid group tags. `tag` is stored WITHOUT the leading '#'.
  await queryFn(`
    CREATE TABLE group_tags (
      id int unsigned NOT NULL AUTO_INCREMENT,
      tag varchar(64) NOT NULL,
      name varchar(255) DEFAULT NULL,
      created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      UNIQUE KEY uniq_group_tags_tag (tag)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`)

  // A contribution can carry several group tags.
  await queryFn(`
    CREATE TABLE contribution_group_tags (
      id int unsigned NOT NULL AUTO_INCREMENT,
      contribution_id int unsigned NOT NULL,
      group_tag_id int unsigned NOT NULL,
      created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      UNIQUE KEY uniq_contribution_group_tag (contribution_id, group_tag_id),
      KEY idx_cgt_contribution_id (contribution_id),
      KEY idx_cgt_group_tag_id (group_tag_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`)

  // A user's personal tag list. Lowest sort_order = main tag (pre-filled on submit).
  await queryFn(`
    CREATE TABLE user_group_tags (
      id int unsigned NOT NULL AUTO_INCREMENT,
      user_id int unsigned NOT NULL,
      group_tag_id int unsigned NOT NULL,
      sort_order int unsigned NOT NULL DEFAULT 0,
      created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      UNIQUE KEY uniq_user_group_tag (user_id, group_tag_id),
      KEY idx_ugt_user_id (user_id),
      KEY idx_ugt_group_tag_id (group_tag_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`)

  // A moderator's visibility scope: a JSON array of tag strings plus the reserved
  // sentinels '*all' (see everything) and '*untagged' (contributions without a tag).
  // '*' is not a valid tag character, so the sentinels can never collide with a real tag.
  // NULL = no restriction (backward compatible: existing moderators keep full visibility).
  await queryFn(
    'ALTER TABLE `user_roles` ADD COLUMN `visible_group_tags` text NULL DEFAULT NULL AFTER `role`;',
  )

  // Stamped whenever the group is set through the group field, including when it is set to
  // "no group". That is the only thing separating "deliberately none" from "never said
  // anything" — the submission pre-fill walks back to the newest statement and has to know
  // the difference. NULL on the existing stock, which has never made a statement.
  await queryFn(
    'ALTER TABLE `contributions` ADD COLUMN `group_tags_set_at` datetime(3) NULL DEFAULT NULL;',
  )

  // contributions carried no index on user_id at all. Every per-member question pays for
  // that: the submission pre-fill, the member's own contribution list and its ordering.
  await queryFn(
    'CREATE INDEX idx_contributions_user_created ON contributions (user_id, created_at);',
  )
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('DROP INDEX idx_contributions_user_created ON contributions;')
  await queryFn('ALTER TABLE `contributions` DROP COLUMN `group_tags_set_at`;')
  await queryFn('ALTER TABLE `user_roles` DROP COLUMN `visible_group_tags`;')
  await queryFn(`DROP TABLE user_group_tags;`)
  await queryFn(`DROP TABLE contribution_group_tags;`)
  await queryFn(`DROP TABLE group_tags;`)
}
