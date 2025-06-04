/* MIGRATION TO CLEAN PRODUCTION DATA
 *
 * cleanup the login_user_backups.
 * Delete data with no reference in login_users table and
 * delete the right one of the duplicate keys
 */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // Delete data with no reference in login_users table
  await queryFn(`DELETE FROM login_user_backups WHERE user_id NOT IN (SELECT id FROM login_users)`)

  // Delete duplicates which have changed for some reasons
  await queryFn(`DELETE FROM login_user_backups WHERE id IN (21, 103, 313, 325, 726, 750, 1098)`)
}

export async function downgrade(
  /* queryFn: (query: string, values?: any[]) => Promise<Array<any>> */
) {
  // cannot undelete things
}
