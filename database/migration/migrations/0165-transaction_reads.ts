// AI-GENERATED — not an architecture reference
// Received transfers that were seen (Bernd, 26.10.2026, Chat E-086): a transfer the member
// received counts as unread -- the gold dot at the person, the bold line under their name, the
// mark in the menu -- until the member saw it: its conversation showed it, it was opened in the
// booking list, or the member answered it with a reaction.
//
// `transaction_reads`, one row for a received transfer that was seen:
//
//   transaction_id  the recipient's row of the transfer, their RECEIVE booking, by its id --
//                   the row a reaction hangs on as well (0159). PRIMARY KEY: seen once is seen.
//   created_at      when it was first seen, as every table of these has it. Read by nobody.
//
// `transaction_reads_start`, one row (`id` 1): the highest booking id when this migration ran.
// Every transfer received up to it counts as seen -- otherwise every member would find a dot at
// everybody who ever sent them Gradido, the day this goes live (Bernd, 26.10.2026: all transfers
// before it count as read). It bounds what the chat's beat reads as well: only the bookings
// above it. The services are stopped while migrations run (start.sh), so no booking is written
// between the read of the highest id and the row that keeps it.
//
// ⛔ A row per SEEN transfer, not a read pointer per person as the chat has one: the pointer
// would have to be kept by the pair of the person, and comparing that pair with the pair a
// booking names means comparing columns of two tables that the migrations created with
// different collations, which the database refuses (measured with the chat's contacts, #3965).
// An id compares with an id.
//
// No foreign key, with the reasoning of 0118, 0154 and 0159: a booking is history, and no
// constraint of another table should stand in the way of anything a ledger does. No index
// beside the primary keys: a transfer is only ever looked up here by its id.
//
// `IF NOT EXISTS` / `IF EXISTS` and `INSERT IGNORE`: DDL does not roll back, and start.sh has
// already stopped the services; a second run keeps the start of the first.
export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`
    CREATE TABLE IF NOT EXISTS transaction_reads (
      transaction_id int(10) unsigned NOT NULL,
      created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (transaction_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`)
  await queryFn(`
    CREATE TABLE IF NOT EXISTS transaction_reads_start (
      id tinyint(3) unsigned NOT NULL,
      transaction_id int(10) unsigned NOT NULL,
      created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`)
  await queryFn(`
    INSERT IGNORE INTO transaction_reads_start (id, transaction_id)
    SELECT 1, COALESCE(MAX(id), 0) FROM transactions;`)
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('DROP TABLE IF EXISTS transaction_reads_start;')
  await queryFn('DROP TABLE IF EXISTS transaction_reads;')
}
