/* MIGRATION TO add new pending_transactions table */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`
    CREATE TABLE pending_transactions (
      id int unsigned NOT NULL AUTO_INCREMENT,
      state int(10) NOT NULL,
      previous int(10) unsigned DEFAULT NULL NULL,
      type_id int(10) DEFAULT NULL NULL,
      transaction_link_id int(10) unsigned DEFAULT NULL NULL,
      amount decimal(40,20) DEFAULT NULL NULL,
      balance decimal(40,20) DEFAULT NULL NULL,
      balance_date datetime(3) DEFAULT current_timestamp(3) NOT NULL,
      decay decimal(40,20) DEFAULT NULL NULL,
      decay_start datetime(3) DEFAULT NULL NULL,
      memo varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
      creation_date datetime(3) DEFAULT NULL NULL,
      user_id int(10) unsigned NOT NULL,
      user_gradido_id char(36) NOT NULL,
      user_name varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL NULL,
      user_community_uuid  char(36) NOT NULL,
      linked_user_id int(10) unsigned DEFAULT NULL NULL,
      linked_user_gradido_id char(36) NOT NULL,
      linked_user_name varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL NULL,
      linked_user_community_uuid  char(36) NOT NULL,
      linked_transaction_id int(10) DEFAULT NULL NULL,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`)
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`DROP TABLE pending_transactions;`)
}
