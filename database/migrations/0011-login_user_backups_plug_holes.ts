/* MIGRATION TO CLEAN PRODUCTION DATA
 *
 * cleanup the login_user_backups table as far a possible.
 * Since the passphrase changed and its type is not detectable
 * this whole thing is a pitfall
 */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // Delete data with no reference in login_users table
  await queryFn(`DELETE FROM login_user_backups WHERE user_id NOT IN (SELECT id FROM login_users)`)
  // Searching for users with a missing password and a backup entry
  // `SELECT * FROM login_user_backups WHERE user_id IN (SELECT id FROM login_users WHERE password = 0)`
  // results in only new users with the proper passphrase scheme - luckily we seem to be good on this one
  // 142 entries in total are found and every entry has type 2 (new one).

  // Delete duplicates which have changed for some reasons
  await queryFn(`DELETE FROM login_user_backups WHERE id IN (21, 103, 313, 325, 726, 750, 1098)`)
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  return [] // cannot undelete things
}
