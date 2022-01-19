/* MIGRATION TO CLEAN PRODUCTION DATA
 *
 * some entries in the state_users table do not have an email.
 * this is required tho to work with the new environment.
 * to mitigate 38 out of 50 emails could be restored from
 * login_users.
 */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // Fill in missing emails from login_users
  // SELECT COUNT(*) FROM state_users LEFT JOIN login_users ON login_users.pubkey = state_users.public_key WHERE state_users.email = '';
  // Before: 50
  // After: 12
  await queryFn(
    `UPDATE state_users
     INNER JOIN login_users ON state_users.public_key = login_users.pubkey
     SET state_users.email = IF(state_users.email = '', login_users.email, state_users.email)
     WHERE state_users.email = '';`,
  )
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  return [] // cannot undelete things
}
