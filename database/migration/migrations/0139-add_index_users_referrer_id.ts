// AI-GENERATED — not an architecture reference
// An index on `users.referrer_id`, the column that says who brought a member here.
//
// Written since 2022 and read for the first time in 2026: `dbFindLatestArrival` asks it on
// every load of the overview (the tile that mirrors an arrival back), and the contact list
// is about to ask it too -- in the column, on the contacts page, and on every tap on a
// name, which goes through `contactByMemberQuery`. Without an index each of those walks
// `users` end to end and sorts what it found.
//
// The column is nullable and almost always null: a secondary index only holds the rows
// that have a value, so this costs next to nothing to keep.
//
// `IF NOT EXISTS` / `IF EXISTS` for the reason 0133 and 0138 give: DDL does not roll back,
// and start.sh has already stopped the services when this runs. A retry after a connection
// dropped halfway must not die on an index that is already there.
export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    'ALTER TABLE `users` ADD INDEX IF NOT EXISTS `idx_users_referrer_id` (`referrer_id`);',
  )
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('ALTER TABLE `users` DROP INDEX IF EXISTS `idx_users_referrer_id`;')
}
