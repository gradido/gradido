// AI-GENERATED — not an architecture reference
// Reactions to transfers (Bernd, 11.10.2026): the recipient of a transfer answers it with an
// emoji -- one of the wallet's forty-eight --, and the two the transfer is between see it with
// the booking, in their booking lists and in their conversation. Only the recipient reacts; one
// reaction a transfer: another one takes its place, the same one again takes it back.
//
// `transaction_reactions`, one row for the reaction to a transfer:
//
//   transaction_id  the recipient's row of the transfer, their RECEIVE booking, by its id.
//                   UNIQUE: one reaction a transfer. The sender's SEND row is found from here --
//                   the two rows of a transfer of this community name each other in
//                   `transactions.linked_transaction_id`.
//   emoji           the reaction. Taken back, the row is deleted.
//   created_at      when the row was written, as every table of these has it: the first
//                   reaction to the transfer -- another emoji in its place keeps it. Read by
//                   nobody.
//
// ⛔ The reaction points at the booking, not the booking at the reaction (the other way round
// from a transfer's picture, 0154): a picture is filed before its booking, a reaction long after
// it -- and a booking is history, on which nothing is written again.
//
// ⛔ `emoji` is compared byte by byte (utf8mb4_bin), as in `chat_message_reactions` (0158): the
// tables' own collation takes most emoji for one and the same character.
//
// No foreign key, with the reasoning of 0118 and 0154: a booking is history, and no constraint
// of another table should stand in the way of anything a ledger does. No index beside the
// unique key: a reaction is only ever asked for by the bookings of a page.
//
// `IF NOT EXISTS` / `IF EXISTS`: DDL does not roll back, and start.sh has already stopped the
// services.
export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`
    CREATE TABLE IF NOT EXISTS transaction_reactions (
      id int(10) unsigned NOT NULL AUTO_INCREMENT,
      transaction_id int(10) unsigned NOT NULL,
      emoji varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
      created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      UNIQUE KEY transaction_reactions_transaction_unique (transaction_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`)
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('DROP TABLE IF EXISTS transaction_reactions;')
}
