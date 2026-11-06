// AI-GENERATED — not an architecture reference
// Whether the recipient has seen a received transfer becomes a column of their RECEIVE booking,
// replacing `transaction_reads` and `transaction_reads_start` (0165).
//
// `transactions.seen`: 1 once the recipient saw the transfer (Chat E-086). Only meaningful on a
// RECEIVE row -- that row belongs to the recipient alone. On every other row it is 0 and read by
// nobody.
//
// Every booking that exists when this runs starts out as seen, because of the DEFAULT 1 the column
// is added with. In MariaDB 10.3+ that is a change to the table's metadata only: no row is
// rewritten. The default then becomes 0, so every booking written from now on starts unseen
// without any writer having to set it. Neither ALTER needs a backfill.
//
// What 0165 counted as unread stays unread: a RECEIVE booking above the start of 0165 with no row
// in `transaction_reads` -- except for a recipient who switched transfers out of their
// conversations (`users.transfers_in_chat` = 0, 0147). From now on their received transfers are
// booked as seen; the ones they piled up stay seen as well, instead of all showing as unread the
// day they switch it back on. The UPDATE reads the primary key from the start upwards only, i.e.
// the bookings since 0165 went live.
//
// No index of its own: the beat reads a member's bookings through the index `user_id` and filters
// them, a few hundred rows at most. An index on `seen` would cost a write on every booking and
// every mark as seen. Add one when an account with very many received transfers shows it is needed.
//
// The services are stopped while migrations run (start.sh), so nothing is booked between the two
// ALTERs. `IF [NOT] EXISTS` on the DDL: it does not roll back, so a second run has to get through
// after a first one that stopped halfway. The UPDATE gives the same result when run twice.
export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    'ALTER TABLE `transactions` ADD COLUMN IF NOT EXISTS `seen` tinyint(1) NOT NULL DEFAULT 1 AFTER `linked_transaction_id`;',
  )
  // 3 = RECEIVE. Frozen here as a number: the enum may change, this migration must not.
  await queryFn(`
    UPDATE transactions t
       SET t.seen = 0
     WHERE t.type_id = 3
       AND t.id > COALESCE((SELECT s.transaction_id FROM transaction_reads_start s WHERE s.id = 1), 0)
       AND NOT EXISTS (SELECT 1 FROM transaction_reads r WHERE r.transaction_id = t.id)
       AND EXISTS (SELECT 1 FROM users u WHERE u.id = t.user_id AND u.transfers_in_chat = 1);`)
  await queryFn('ALTER TABLE `transactions` ALTER COLUMN `seen` SET DEFAULT 0;')
  // Both in one statement: a run that stopped earlier left both tables, so a second run finds them.
  await queryFn('DROP TABLE IF EXISTS transaction_reads_start, transaction_reads;')
}

// Restores 0165's tables with the same meaning. The start goes just below the oldest unseen RECEIVE
// booking (or to the newest booking if nothing is unseen), so `transaction_reads` only needs the
// seen ones above it -- not one row for every booking ever received.
export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
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
    SELECT 1, COALESCE(
      (SELECT MIN(id) - 1 FROM transactions WHERE type_id = 3 AND seen = 0),
      (SELECT MAX(id) FROM transactions),
      0
    );`)
  await queryFn(`
    INSERT IGNORE INTO transaction_reads (transaction_id)
    SELECT t.id FROM transactions t
     WHERE t.type_id = 3
       AND t.seen = 1
       AND t.id > (SELECT s.transaction_id FROM transaction_reads_start s WHERE s.id = 1);`)
  await queryFn(
    'ALTER TABLE `transactions` DROP COLUMN IF EXISTS `seen`;',
  )
}
