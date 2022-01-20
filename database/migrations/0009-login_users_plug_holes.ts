/* MIGRATION TO CLEAN PRODUCTION DATA
 *
 * some entries in the login_users table are inconsistent.
 * As solution the inconsistent data is purged and the corresponding
 * account is set as not yet activated
 */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // Remove incomplete data and set account as not activated yet.
  await queryFn(
    `UPDATE login_users SET password = 0, pubkey = NULL, email_checked = 0 WHERE privkey IS NULL;`,
  )
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  return [] // cannot undelete things
}
