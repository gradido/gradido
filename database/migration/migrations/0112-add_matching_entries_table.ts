// AI-GENERATED — not an architecture reference
// Matching entries: what a member publishes to be found by — an offer, a need, or an
// interest. One row per entry, several per member.
//
// The staging strand grew this table in two steps: 0105 created it as `gms_entries`,
// 0109 renamed it and its two columns to `matching_entries` / `uuid` / `matching_type`.
// Here it is created in its final shape in one go. Splitting it would mean creating a
// table under a name this database has never seen, only to rename it two migrations
// later; the resulting schema is identical either way, index names included.
//
// `remote` says the member can do this from anywhere, so a match need not be nearby.
// `active` is the pause switch: an inactive entry stays in the member's list but is
// withdrawn from the GMS, which makes pausing and deleting the very same operation
// towards the outside.
//
// `uuid` is what the member's own client and the GMS both refer to, so it is unique and
// indexed; the auto-increment id never leaves this database. user_id is indexed for the
// one read that matters — a member's own entries.

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`
    CREATE TABLE matching_entries (
      id int unsigned NOT NULL AUTO_INCREMENT,
      uuid char(36) NOT NULL,
      user_id int unsigned NOT NULL,
      matching_type varchar(12) NOT NULL,
      summary varchar(160) NOT NULL,
      details text,
      remote tinyint(1) NOT NULL DEFAULT 0,
      active tinyint(1) NOT NULL DEFAULT 1,
      created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      UNIQUE KEY uniq_matching_entries_uuid (uuid),
      KEY idx_matching_entries_user_id (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`)
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`DROP TABLE matching_entries;`)
}
