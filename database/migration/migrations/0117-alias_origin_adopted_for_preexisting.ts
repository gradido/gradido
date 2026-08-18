// AI-GENERATED — not an architecture reference
//
// Correction to 0116 for the systems where it has already run.
//
// 0116 recorded every name that existed before it as 'assigned'. That was reasoned from
// the quota alone - nobody had chosen under the new rules yet - and it missed the second
// meaning the value carries: 'assigned' also says "the question is still open", and that
// is what puts the window at first login on screen.
//
// It is wrong on the facts. 0116 is the only migration that has ever written
// `users.alias`; every value it found had been set by a person, at registration or in
// the settings. Those members were shown a window telling them "we suggested a name for
// you" about a name they had picked themselves, sometimes years earlier.
//
// 0116 now writes 'adopted' for them. This migration carries the same correction to a
// database that already ran the old version.
//
// It cannot separate those rows from the ones `createUser` wrote as 'assigned' in the
// window between the two deployments - a member who registered in exactly that window
// would lose the first-login question. Checked before shipping: nobody registered in it.
// On every other system 0117 follows 0116 within the same deploy, so there is nothing
// else for it to catch, which is why the predicate stays this plain.
//
// Idempotent: running it where 0116 already wrote 'adopted' matches nothing.

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`UPDATE user_aliases SET origin = 'adopted' WHERE origin = 'assigned';`)
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // Deliberately empty. Turning 'adopted' back into 'assigned' would hit the names the
  // member kept of their own accord as well - this migration cannot tell them apart
  // afterwards, and guessing would put the window back in front of people who answered.
  // Leaving the value alone costs nothing: 'adopted' and 'assigned' differ only in
  // whether the question counts as answered, and 0116's own rollback keys on 'migrated'.
  await queryFn(`SELECT 1;`)
}
