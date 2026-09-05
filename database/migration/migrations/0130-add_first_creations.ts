// AI-GENERATED — not an architecture reference
// The first creation (ES-002..ES-011): the state of ONE process per member — from
// "sentences saved" to "thanked" or "waiting for a human" — and the one message that is
// shown three times (thread of the first contribution, mail, window).
//
// The contributions themselves are ordinary rows in `contributions` (type USER): the
// first creation IS the normal procedure, only orchestrated (ES-002). This table
// therefore holds no amounts and no memos, just which contributions belong to the
// process (`contribution_ids`, a JSON list) and where it stands.
//
// `user_id` is UNIQUE: one first creation per member, expressed in the schema. The
// function-test area (L4) reopens the window by moving the SAME row to FORCED, never by
// adding a second one.
//
// `status`: FORCED · SUBMITTED · IN_REVIEW · DONE · DONE_UNBOOKED (see
// database/src/enum/FirstCreationStatus.ts). `review_reason`: SUSPICION · MODEL_TIMEOUT ·
// MODEL_ERROR. `test_mode`: WITH_BOOKING · WITHOUT_BOOKING, NULL for a real run.
//
// No foreign keys, like every table of this generation: users are soft-deleted, so a
// cascade would never fire and would only look like protection.
//
// ⛔ `IF NOT EXISTS`, same reason as 0125..0128: DDL in MySQL and MariaDB does not roll
// back, and `start.sh` has already stopped the services by the time this runs.
export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`
    CREATE TABLE IF NOT EXISTS first_creations (
      id int(10) unsigned NOT NULL AUTO_INCREMENT,
      user_id int(10) unsigned NOT NULL,
      status varchar(16) NOT NULL,
      review_reason varchar(16) DEFAULT NULL,
      entries_count tinyint(3) unsigned NOT NULL,
      contribution_ids JSON NOT NULL,
      message text DEFAULT NULL,
      model varchar(64) DEFAULT NULL,
      test_mode varchar(16) DEFAULT NULL,
      signer_user_id int(10) unsigned DEFAULT NULL,
      created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      UNIQUE KEY first_creations_user_id_key (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`)
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('DROP TABLE IF EXISTS first_creations;')
}
