/* MIGRATION TO CLEAN PRODUCTION DATA
 *
 * some entries in the login_users table are inconsistent.
 * As solution the inconsistent data is purged and the corresponding
 * account is set as not yet activated
 */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // Generate a random private key where the required data is present (pubkey + password + passphrase).
  // Furthermore the email needs to be confirmed
  await queryFn(
    `UPDATE login_users SET privkey = UNHEX(SHA1(RAND()))
     WHERE privkey IS NULL
     AND pubkey IS NOT NULL
     AND password != 0
     AND email_checked = 1
     AND id IN (SELECT user_id FROM login_user_backups);`,
  )

  // Remove incomplete data and set account as not activated yet.
  await queryFn(
    `UPDATE login_users SET password = 0, pubkey = NULL, email_checked = 0 WHERE privkey IS NULL;`,
  )
}

export async function downgrade(
  /* queryFn: (query: string, values?: any[]) => Promise<Array<any>> */
) {
  // cannot undelete things
}
