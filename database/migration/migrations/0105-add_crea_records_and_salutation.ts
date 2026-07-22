// DO-3: Crea data layer (decisions E-004 / E-006 / E-007 / E-010 / E-013).
// Part 1: the additive crea_records table (one row per evaluated activity) that
//         becomes the participant history and the study data.
// Part 2: the salutation/signature fields on users (moderator-curated, E-013).

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // Part 1 — Crea records (pseudonymous: community readable, person a pseudonym, no name).
  await queryFn(`
    CREATE TABLE crea_records (
      id int unsigned NOT NULL AUTO_INCREMENT,
      record_uuid char(36) NOT NULL,
      contribution_ref varchar(64) NOT NULL,
      community_uuid char(36) DEFAULT NULL,
      person_pseudonym varchar(64) DEFAULT NULL,
      activity varchar(255) NOT NULL,
      category_key varchar(48) NOT NULL,
      output_type varchar(24) NOT NULL,
      hours double DEFAULT NULL,
      hours_estimated tinyint(1) NOT NULL DEFAULT 0,
      crea_verdict varchar(12) NOT NULL,
      confidence varchar(8) NOT NULL,
      applied_rule varchar(48) DEFAULT NULL,
      discrepancy varchar(24) NOT NULL DEFAULT 'none',
      overall_verdict varchar(12) DEFAULT NULL,
      moderator_final varchar(24) DEFAULT NULL,
      moderator_comment text,
      raw_text text,
      taxonomy_version int unsigned NOT NULL DEFAULT 1,
      ruleset_version int unsigned NOT NULL DEFAULT 1,
      behavior_version int unsigned NOT NULL DEFAULT 1,
      model varchar(48) DEFAULT NULL,
      created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      UNIQUE KEY uniq_crea_records_record_uuid (record_uuid),
      KEY idx_crea_records_contribution_ref (contribution_ref),
      KEY idx_crea_records_community_uuid (community_uuid),
      KEY idx_crea_records_person_pseudonym (person_pseudonym),
      KEY idx_crea_records_category_key (category_key)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`)

  // Part 2 — salutation / gender / moderator signature on users (E-013).
  // All nullable: null = not yet curated by the moderator.
  await queryFn('ALTER TABLE `users` ADD COLUMN `gender` varchar(8) NULL DEFAULT NULL;')
  await queryFn(
    'ALTER TABLE `users` ADD COLUMN `salutation` varchar(255) NULL DEFAULT NULL AFTER `gender`;',
  )
  await queryFn(
    'ALTER TABLE `users` ADD COLUMN `crea_signature` varchar(255) NULL DEFAULT NULL AFTER `salutation`;',
  )
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('ALTER TABLE `users` DROP COLUMN `crea_signature`;')
  await queryFn('ALTER TABLE `users` DROP COLUMN `salutation`;')
  await queryFn('ALTER TABLE `users` DROP COLUMN `gender`;')
  await queryFn(`DROP TABLE crea_records;`)
}
