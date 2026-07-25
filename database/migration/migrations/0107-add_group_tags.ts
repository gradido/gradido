// Group functions: structured group tags for
// common-good contributions, replacing the fragile inline-hashtag-in-memo convention.
// Adds:
//   - group_tags: the canonical list of valid tags (admin-managed).
//   - contribution_group_tags: a contribution can carry several tags.
//   - user_group_tags: a user's personal tag list; the lowest sort_order is the
//     "main tag", pre-filled in the group-tag field on submission.
//   - user_roles.visible_group_tags: a moderator's visibility scope.
// Backward compatible: legacy inline "#tag" in contributions.memo stays searchable.
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
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('ALTER TABLE `user_roles` DROP COLUMN `visible_group_tags`;')
  await queryFn(`DROP TABLE user_group_tags;`)
  await queryFn(`DROP TABLE contribution_group_tags;`)
  await queryFn(`DROP TABLE group_tags;`)
}
