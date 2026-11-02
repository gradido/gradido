// AI-GENERATED — not an architecture reference
// The trail of a thank-you passed on (Bernd, 27.10.2026, the waves of gratitude): a member who
// received a thank-you and passes it on -- "Jemandem danken" in the opened row of a transfer
// received, or on the tile "Dein Dank ist da." of the overview -- sends a transfer of their own,
// and that transfer remembers which thank-you it passes on. Nothing of it is shown: no line, no
// mail, no event, no setting. It is what makes "passed on" countable at all, and the way a
// thank-you travels on from one member to the next can only be followed through it. A thank-you
// passed on before this table existed is counted nowhere.
//
// `transaction_pass_ons`, one row for a transfer that passes a thank-you on:
//
//   transaction_id         the transfer that passes it on: the sender's row of it, their SEND
//                          booking, by its id. PRIMARY KEY: a transfer passes on one thank-you
//                          at most.
//   origin_transaction_id  the thank-you passed on: the same member's RECEIVE booking of the
//                          transfer they received -- the row a reaction hangs on as well (0159).
//                          KEY: the question asked from this side is who passed a thank-you on.
//                          Not unique: one thank-you may be passed on more than once.
//   created_at             when the row was written, as every table of these has it.
//
// Only what the member chose: the two buttons name the booking. A transfer that merely follows
// one received is not read as passing it on. And only within this community: a transfer to a
// member of another community carries none (sendCoins).
//
// ⛔ The row points at the booking, not the booking at the row: the two rows of a transfer are
// committed before the trail is written (executeTransaction), and a booking is history. A trail
// that could not be written is missing; the transfer stands all the same.
//
// No foreign key, with the reasoning of 0118, 0154, 0159 and 0165: a booking is history, and no
// constraint of another table should stand in the way of anything a ledger does.
//
// `IF NOT EXISTS` / `IF EXISTS`: DDL does not roll back, and start.sh has already stopped the
// services.
export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`
    CREATE TABLE IF NOT EXISTS transaction_pass_ons (
      transaction_id int(10) unsigned NOT NULL,
      origin_transaction_id int(10) unsigned NOT NULL,
      created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (transaction_id),
      KEY transaction_pass_ons_origin_transaction_id_idx (origin_transaction_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`)
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('DROP TABLE IF EXISTS transaction_pass_ons;')
}
