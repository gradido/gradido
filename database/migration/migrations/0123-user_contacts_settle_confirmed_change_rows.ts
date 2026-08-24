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

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    'UPDATE `user_contacts` SET `email_opt_in_type_id` = 1 WHERE `email_opt_in_type_id` = 3 AND `email_checked` = 1;',
  )
}

export async function downgrade(_queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // Not reversible, and it need not be: the rows are confirmed addresses either way, and
  // which opt-in type they carry says nothing about them any more once they are settled.
}
