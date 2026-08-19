// AI-GENERATED — not an architecture reference
// Which thank you card a booking was made with, on BOTH rows of it -- the SEND row of the
// payer and the RECEIVE row of the till. The wallet shows a marker for it in the booking
// list, the way it already does for a transaction link.
//
// ⚠️ The CARD, not its name. Cards cannot be renamed today, so the two could not diverge --
// but a booking that carried a copy of the name would freeze it, and a booking that points
// at the card cannot go stale. The name is looked up where it is shown, and only there.
//
// Nullable with no default, and nothing is filled in for what already exists: every booking
// made before this column was a link or a plain transfer, and writing anything into those
// rows would claim a card that was never involved.
//
// ⛔ No foreign key, deliberately, and the same reasoning as `transaction_link_id` right
// next to it: a booking is history. If a card row ever went away, the constraint would
// either take the booking with it or block the deletion -- and neither is what a ledger
// should do about a card that no longer exists.

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    'ALTER TABLE `transactions` ADD COLUMN `thank_you_card_id` int unsigned NULL DEFAULT NULL AFTER `transaction_link_id`;',
  )
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('ALTER TABLE `transactions` DROP COLUMN `thank_you_card_id`;')
}
