// AI-GENERATED — not an architecture reference
// `users.account_state`: where an account stands, as one value instead of a rule spread over
// `foreign`, `deleted_at`, `email_checked` of the email contact and the password type
// (AccountState in database/src/enum). Written from here on by every place that changes one
// of those; read, for now, only by the guarantor count at the table (GUARANTOR_LIMIT). The
// other readers follow in the issue "Complete refactor for account state".
//
// A MySQL ENUM: stored as one byte, while the name stays readable in every query. ⛔ The
// list is append only - the byte is the position, so reordering it or removing a value
// rebuilds the table and moves every row to another state. The values here are the frozen
// copy of the enum as it stood when this was written.
//
// The fill, in the order the rules are checked - the first that applies wins:
//   foreign                                              -> FOREIGN
//   deleted_at set                                       -> DELETED
//   email confirmed                                      -> ACTIVATED
//   brought by a guarantor, holds a password, unconfirmed -> PARTLY_ACTIVATED_GUARANTOR
//   everything else                                      -> REGISTERED
// The fourth line is the rule `dbCountUnconfirmedVouchedAccounts` counted by until now: an
// account opened at a table is the only unconfirmed one that holds a password.
//
// In ranges of 500 ids, so no single statement locks the whole table. `IF NOT EXISTS`: DDL
// does not roll back, and start.sh has already stopped the services.
const BATCH_SIZE = 500

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `account_state` ENUM('REGISTERED', 'PARTLY_ACTIVATED_GUARANTOR', 'ACTIVATED', 'DELETED', 'FOREIGN') NOT NULL DEFAULT 'REGISTERED' AFTER `humhub_allowed`;",
  )

  const [{ maxId }] = await queryFn('SELECT COALESCE(MAX(`id`), 0) AS maxId FROM `users`;')
  for (let fromId = 1; fromId <= Number(maxId); fromId += BATCH_SIZE) {
    await queryFn(
      `UPDATE \`users\` u
         LEFT JOIN \`user_contacts\` c ON c.\`id\` = u.\`email_id\`
       SET u.\`account_state\` = CASE
         WHEN u.\`foreign\` = 1 THEN 'FOREIGN'
         WHEN u.\`deleted_at\` IS NOT NULL THEN 'DELETED'
         WHEN c.\`email_checked\` = 1 THEN 'ACTIVATED'
         WHEN u.\`referrer_id\` IS NOT NULL AND u.\`password_encryption_type\` <> 0
           THEN 'PARTLY_ACTIVATED_GUARANTOR'
         ELSE 'REGISTERED'
       END
       WHERE u.\`id\` >= ? AND u.\`id\` < ?;`,
      [fromId, fromId + BATCH_SIZE],
    )
  }
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('ALTER TABLE `users` DROP COLUMN IF EXISTS `account_state`;')
}
