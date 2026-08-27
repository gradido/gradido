// AI-GENERATED — not an architecture reference
// A confirmed address is not a change in flight. Until now a row that had been changed TO
// kept the CHANGE opt-in type after its confirmation, which was harmless only because the
// pending lookup also demanded `email_checked = 0`. Going back to an address one held
// before borrows exactly such a row - already confirmed - so the type has to be the thing
// that says "in flight", and a settled row must not carry it.
//
// Touches only rows that are confirmed AND still marked as a change: on production there
// are none (the feature is three days old), on the test systems a handful from trying it
// out. Nothing else in the tree reads this combination.
//
// ⛔ `change_veto_code IS NULL` added on 27.08.2026, and it is the difference between
// history and something that is happening right now. Since the change back, "confirmed AND
// marked as a change" is also the signature of a LIVE take-back - the member's own earlier
// address, borrowed, waiting for a click. A settled row had its veto code cleared when it
// was confirmed; a live one still carries it. Without the clause a re-run (`down` then `up`,
// which drops the version row and executes this again) would silently strip the CHANGE type
// off changes in flight: confirmation link and veto link would both answer "invalid", the
// wallet would show nothing pending, and the member would get no hint at all.
//
// Yes, this edits a migration that has already run. It is defensible precisely here: the
// only path that reads this file again IS a re-run, the clause only narrows, and on every
// system where it already ran correctly it selects the same rows.

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    'UPDATE `user_contacts` SET `email_opt_in_type_id` = 1 WHERE `email_opt_in_type_id` = 3 AND `email_checked` = 1 AND `change_veto_code` IS NULL;',
  )
}

export async function downgrade(_queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // Not reversible, and it need not be: the rows are confirmed addresses either way, and
  // which opt-in type they carry says nothing about them any more once they are settled.
}
