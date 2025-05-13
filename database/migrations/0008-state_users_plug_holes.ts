/* MIGRATION TO CLEAN PRODUCTION DATA
 *
 * some entries in the state_users table do not have an email.
 * this is required tho to work with the new environment.
 * to mitigate 38 out of 50 emails could be restored from
 * login_users.
 */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // Fill in missing emails from login_users
  await queryFn(
    `UPDATE state_users
     INNER JOIN login_users ON state_users.public_key = login_users.pubkey
     SET state_users.email = login_users.email
     WHERE state_users.email = '';`,
  )
  // Delete remaining ones
  await queryFn(`DELETE FROM state_users WHERE email = ''`)
}

export async function downgrade(
  /* queryFn: (query: string, values?: any[]) => Promise<Array<any>> */
) {
  // cannot undelete things
}
