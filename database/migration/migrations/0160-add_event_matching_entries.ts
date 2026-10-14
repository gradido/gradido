// AI-GENERATED — not an architecture reference
// The entry an event link notes at a registration (Event-Matching, 13.10.2026): a host hands the
// people of a congress a link that offers one entry for the matching, an interest -- "I love
// ‹summary›". Whoever registers through it brings the entry along with the registration, and it
// is made when the address is confirmed: nothing of an account is found by others before a mail
// was clicked. In between it waits here, at the account -- not in the browser, because the mail
// is often opened on another device.
//
// `event_matching_entries`, one row for the entry that waits at an account:
//
//   user_id     whose account. UNIQUE: one entry an account -- a link offers one, and only the
//               registration that opens the account notes it.
//   summary     what completes the sentence, as `matching_entries.summary` holds it.
//   details     the line or two that explain it, or NULL.
//   remote      whether the entry is to be found from afar as well.
//   created_at  when it was noted: the registration.
//
// The kind is not a column: an event link offers an interest, always.
//
// A row is there while it waits. The transaction that makes the entry removes it, and that is
// the whole state: no row, nothing to make -- so a second confirmation, or a password set anew,
// makes no second entry, also where the member has deleted the entry since. Nothing is kept as
// a mark: once the entry is made, its words are the member's entry, theirs to change and to
// delete, and a second copy here would outlive both. A row older than thirty days is let go at
// the next confirmation instead of made (backend, makeEventMatchingEntry). The row of an
// account that never confirms its address stays with that account, as its name and address do.
//
// ⛔ Not a paused row in `matching_entries`, which would need no table: the member's own list
// shows paused entries and the overview counts them, and an account that can sign in before it
// is confirmed -- one a member vouches for -- would find there an entry it never paused. Nor
// could a paused row say whether the member paused it or it waits for the mail.
//
// No foreign key, as in 0112 and 0118. `IF NOT EXISTS` / `IF EXISTS`: DDL does not roll back,
// and start.sh has already stopped the services.
export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`
    CREATE TABLE IF NOT EXISTS event_matching_entries (
      id int unsigned NOT NULL AUTO_INCREMENT,
      user_id int unsigned NOT NULL,
      summary varchar(160) NOT NULL,
      details text DEFAULT NULL,
      remote tinyint(1) NOT NULL DEFAULT 1,
      created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      UNIQUE KEY event_matching_entries_user_unique (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`)
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('DROP TABLE IF EXISTS event_matching_entries;')
}
