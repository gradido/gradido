// AI-GENERATED — not an architecture reference
// The favourites a member marks with the heart: "this is somebody close to me".
//
// A favourite is a CONTACT first -- somebody the member has exchanged Gradido with --
// and the contact list itself is not a table but a grouping over `transactions`, which
// already carries the counterparty of every SEND and RECEIVE row. Only the heart needs
// storing, so this table holds nothing but who marked whom, and when.
//
// The favourite is identified by the uuid pair (community + member), never by the alias:
// an alias can change, the pair cannot, and the pair reaches across community borders
// where a local user id does not. For a member of this community whose `users` row has
// no community_uuid yet (registered before the home community had one), the home
// community's uuid is written -- the same substitution the member-avatar key makes.
//
// The primary key IS the rule "one heart per person", expressed in the schema so that a
// duplicate is structurally impossible rather than avoided by whoever writes the next
// query. A second insert of the same pair is therefore not an error but the same heart,
// and the insert query treats it as a success (ON DUPLICATE KEY UPDATE, no change).
//
// No foreign key on purpose: users are soft-deleted (users.deleted_at), so ON DELETE
// CASCADE would never fire and would only look like protection. Wherever an account is
// removed for good, its favourites have to be removed with it -- a code obligation, not
// something the schema can carry (see dbDeleteFavoritesByUserId).
//
// ⛔ `IF NOT EXISTS`, same reason as 0125..0127: DDL in MySQL and MariaDB does not roll
// back, and `start.sh` has already stopped the services by the time this runs.
export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`
    CREATE TABLE IF NOT EXISTS user_favorites (
      user_id int(10) unsigned NOT NULL,
      favorite_community_uuid varchar(36) NOT NULL,
      favorite_gradido_id varchar(36) NOT NULL,
      created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (user_id, favorite_community_uuid, favorite_gradido_id),
      KEY idx_user_favorites_user_id (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`)
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('DROP TABLE IF EXISTS user_favorites;')
}
