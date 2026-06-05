/* MIGRATION TO add new alias history table */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`
    CREATE TABLE alias_history (
      id int unsigned NOT NULL AUTO_INCREMENT,
      user_id int unsigned NOT NULL,
      alias varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
      community_uuid varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
      created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      UNIQUE KEY alias (alias, community_uuid)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`)

  await queryFn(
    `ALTER TABLE users ADD alias_startupdate_at datetime(3) DEFAULT NULL after alias;`,
  )
  await queryFn(
    `ALTER TABLE users ADD alias_update_count int DEFAULT 0 after alias_startupdate_at;`,
  )
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`DROP TABLE alias_history;`)
  await queryFn(`ALTER TABLE users DROP COLUMN alias_startupdate_at;`)
  await queryFn(`ALTER TABLE users DROP COLUMN alias_update_count;`)
}
