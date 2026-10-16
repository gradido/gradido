// AI-GENERATED — not an architecture reference
// Who came in by an event link and has not been invited onto the map for it yet (Event-Matching,
// 16.10.2026). A member who registers through the link of a congress gets the entry of the link
// when the address is confirmed (0160, `event_matching_entries`). What comes next is the map: the
// wallet invites them to set their home, right after they have answered the question of their
// name, so that they find the others of that congress (Bernd, KA-015). The mail is often opened
// on another device than the link, so the wallet cannot know it there -- the account says it.
//
// `event_matching_arrivals`, one row for an invitation that is due:
//
//   user_id              whose account. UNIQUE: an account registers once, and a link notes one
//                        entry at it.
//   matching_entry_uuid  the entry the confirmation made of the note. The invitation names the
//                        sentence of that entry, read from the entry itself when it is shown.
//   created_at           when the entry was made: the confirmation.
//
// No words are kept here, for the reason 0160 keeps none once the entry is made: they are the
// member's entry, theirs to change and to delete, and a copy would outlive both. Where the
// entry is gone by the time the wallet asks, there is no invitation to give.
//
// A row is there while the invitation is due. The wallet takes it away once it has had the
// screen (or once the member stands on the map anyway), and that is the whole state: the
// invitation comes once, after the first sign-in that follows the confirmation, on whichever
// device that sign-in happens.
//
// No foreign key, as in 0112, 0118 and 0160. `IF NOT EXISTS` / `IF EXISTS`: DDL does not roll
// back, and start.sh has already stopped the services.
export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`
    CREATE TABLE IF NOT EXISTS event_matching_arrivals (
      id int unsigned NOT NULL AUTO_INCREMENT,
      user_id int unsigned NOT NULL,
      matching_entry_uuid char(36) NOT NULL,
      created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      UNIQUE KEY event_matching_arrivals_user_unique (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`)
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('DROP TABLE IF EXISTS event_matching_arrivals;')
}
