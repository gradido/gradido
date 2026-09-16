// AI-GENERATED — not an architecture reference
// When a member of ANOTHER community last changed the picture their own community lets
// members see -- as this community last heard it (AS-019).
//
// The booking list and the contact list send a date with every counterparty, and the wallet
// asks for a picture only where there is one: it keeps a picture while the date stays the
// same and forgets it when the date goes. For this community's own members the date comes
// from their `user_avatars` row. Members of other communities have none here and never will
// (AS-004: no foreign pictures stored), so their date is asked of their community by a
// timer (backend refreshForeignMemberAvatarDates) and kept in this table.
//
// Keyed by the uuid PAIR (community + member), never by `users.id`: the same key the wallet
// stores pictures under and `user_favorites` uses, and a booking can name a member of
// another community whose `users` row was never stored -- a key that needs the row would
// have nothing to point at.
//
// `avatar_updated_at` NULL: their community was asked and has nothing to show -- no picture,
// the switch off, the member deleted. This is how a withdrawal arrives. A pair with no row
// at all has no answer yet; the lists read both the same way.
//
// `checked_at`: when the timer last had an answer for the pair. Nothing reads it yet; it is
// what tells a stale row from a fresh one when a community stops answering.
//
// Existing members of other communities have no row here after the migration: until the
// timer's first run (one interval after the backend starts) they show letters, as before.
//
// No foreign key, for the reason 0128 gives: users are soft-deleted, so a cascade would never
// fire -- and a pair does not even need a `users` row.
//
// ⛔ `IF NOT EXISTS`, same reason as 0125..0128: DDL in MySQL and MariaDB does not roll back,
// and `start.sh` has already stopped the services by the time this runs.
export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`
    CREATE TABLE IF NOT EXISTS foreign_member_avatar_dates (
      community_uuid varchar(36) NOT NULL,
      gradido_id varchar(36) NOT NULL,
      avatar_updated_at datetime(3) NULL DEFAULT NULL,
      checked_at datetime(3) NOT NULL,
      PRIMARY KEY (community_uuid, gradido_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`)
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('DROP TABLE IF EXISTS foreign_member_avatar_dates;')
}
