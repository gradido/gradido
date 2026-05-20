/* MIGRATION TO add new alias history table */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`
    CREATE TABLE alias_history (
      id int unsigned NOT NULL AUTO_INCREMENT,
      user_id int unsigned NOT NULL,
      alias varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
      community_uuid varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
      created_at datetime(3) NOT NULL,
      PRIMARY KEY (id),
      UNIQUE KEY alias (alias, community_uuid)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`)
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`DROP TABLE alias_history;`)
}
