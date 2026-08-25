// AI-GENERATED — not an architecture reference
// A registration attempt that rang an existing member's doorbell (EM-013).
//
// When somebody registers with an address that already belongs to a member AND the
// attempt carries a redeem code (the café case), the attempt is parked here and the
// existing member's multi-registration mail gets a third branch: "I am helping someone
// set up a Gradido account". The helper link carries `assist_code`; the page behind it
// asks for the guest's real address and lets the guest type a password, then the
// account is created from this row — with the guest's own address from second one.
//
// Without a redeem code nothing is stored and the mail stays as it always was: the
// main case of that mail is "I forgot I already have an account", and a helper button
// would only confuse it.
//
// Rows expire after the same window as every other mail code (24h) and are purged
// lazily whenever a new attempt is parked — same pattern as expired e-mail changes.
// No foreign key on host_user_id on purpose: users are soft-deleted, the constraint
// would never fire; the purge is what keeps this table small.
export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`
    CREATE TABLE assisted_registrations (
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

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('DROP TABLE IF EXISTS assisted_registrations;')
}
