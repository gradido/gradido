// AI-GENERATED — not an architecture reference
// The moderation's remark on a member (Bernd, 28.10.2026): beside the pin and the arrow of an
// opened contribution, a few words every moderator reads and writes -- "Bürgermeisterin von
// Lieblingsstadt", "Tochter von Ramona", "Rentner seit Januar 25" --, so that nobody has to search
// the member's whole history of contributions for them again.
//
// `user_remarks`, one row for a member the moderation keeps a remark on:
//
//   user_id     whom it is about: the member. Never shown to them, not in the wallet either.
//   remark      the words, at most USER_REMARK_MAX_CHARS (shared); a `text` holds them.
//   updated_by  the moderator who wrote them last, shown beside them with updated_at.
//   created_at, updated_at  as the other tables have them.
//
// PRIMARY KEY (user_id): one remark per member, which every moderator writes on. Writing it again
// replaces it, and an emptied remark is no row.
//
// No foreign key, as for the members' own notes (0167): users are soft-deleted, and a remark stays
// with a member whose account is restored.
//
// `IF NOT EXISTS` / `IF EXISTS`: DDL does not roll back, and start.sh has already stopped the
// services.
export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`
    CREATE TABLE IF NOT EXISTS user_remarks (
      user_id int(10) unsigned NOT NULL,
      remark text NOT NULL,
      updated_by int(10) unsigned NOT NULL,
      created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`)
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('DROP TABLE IF EXISTS user_remarks;')
}
