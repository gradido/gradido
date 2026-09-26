// AI-GENERATED — not an architecture reference
// Drops the parked registration attempts of the doorbell entry again (EM-013, added by 0124).
//
// The doorbell - a registration with an existing member's address and a redeem code, parked
// here until the member's mail led to a helper page - is gone. An account that holds a password
// while its address is unconfirmed is now opened at the table, with the presence code, and
// nothing reads or writes this table any more. Rows still in it are attempts nobody completed;
// the page their links led to is gone with them.
//
// ⛔ 0124 stays in place. The migration runner loads every migration a database has recorded by
// its file name - a server that ran 0124 would fail to migrate without the file
// (MODULE_NOT_FOUND) and stay on the waiting page.
//
// `IF EXISTS`: DDL does not roll back, and start.sh has already stopped the services when this
// runs. A retry after a connection dropped halfway must not die on a table that is already gone.
//
// The downgrade creates the table again the way 0124 did. The rows do not come back.
export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('DROP TABLE IF EXISTS `assisted_registrations`;')
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`
    CREATE TABLE IF NOT EXISTS assisted_registrations (
      id int(10) unsigned NOT NULL AUTO_INCREMENT,
      first_name varchar(255) NOT NULL,
      last_name varchar(255) NOT NULL,
      language varchar(4) NOT NULL DEFAULT 'de',
      redeem_code varchar(64) NOT NULL,
      publisher_id int(10) DEFAULT NULL,
      project varchar(255) DEFAULT NULL,
      host_user_id int(10) unsigned NOT NULL,
      assist_code bigint(20) unsigned NOT NULL,
      created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      UNIQUE KEY assist_code_key (assist_code)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`)
}
