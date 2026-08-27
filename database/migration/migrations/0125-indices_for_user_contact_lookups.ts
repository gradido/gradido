// AI-GENERATED — not an architecture reference
// Two columns that every request reaches through, and neither had an index.
//
// `users.email_id` was added bare by migration 0049 and never indexed. It is the join
// column of `User.emailContact`, so every lookup that reaches a member through their
// address walks the whole `users` table: `findUserByEmail` — which is the LOGIN — plus
// `setPassword`, `queryOptIn` and `findUserByIdentifier`, all of them unauthenticated
// doors. TypeORM derives a unique index from the `@JoinColumn` in its metadata, which is
// why this is easy to miss; `synchronize: false` means that index never reached the
// database. Worse than one scan: `findOne` injects `take: 1`, and with a join present
// TypeORM runs the query twice, so a successful login pays for two passes.
//
// `user_contacts.user_id` has no index either, and since the e-mail change a member has
// several contact rows, so three lookups now filter on it — the GDT anchor (`ORDER BY
// created_at ASC`, on the account overview), the confirmed-address list (same order), and
// the pending change. `(user_id, created_at)` serves all three: the two ordered ones read
// straight off the index with no filesort, and the third uses the `user_id` prefix.
//
// ⚠️ Plain indices, not UNIQUE. `users.email_id` is a one-to-one relation and a UNIQUE
// would say so and guard it — but it would also FAIL this migration on any production data
// that disagrees, and `start.sh` stops the services before it migrates, so a failure here
// leaves the server on the waiting page. The scan is what this delivery is about; making
// the relation an enforced invariant is a separate question with a separate risk, and it
// needs the data looked at first.

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('ALTER TABLE `users` ADD INDEX `IDX_users_email_id` (`email_id`);')
  await queryFn(
    'ALTER TABLE `user_contacts` ADD INDEX `IDX_user_contacts_user_created` (`user_id`, `created_at`);',
  )
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('ALTER TABLE `users` DROP INDEX `IDX_users_email_id`;')
  await queryFn('ALTER TABLE `user_contacts` DROP INDEX `IDX_user_contacts_user_created`;')
}
