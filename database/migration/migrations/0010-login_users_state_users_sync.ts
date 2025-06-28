/* MIGRATION TO CLEAN PRODUCTION DATA
 *
 * login_users and state_users are not in sync.
 * Copy missing data from login_users to state_users.
 */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // Copy data with intact private key
  await queryFn(
    `INSERT INTO state_users
     (public_key, email, first_name, last_name, username, disabled)
     (SELECT pubkey as public_key, email, first_name, last_name, username, disabled
      FROM login_users
      WHERE email NOT IN (SELECT email from state_users)
      AND privkey IS NOT NULL
     )`,
  )
  // Copy data without intact private key, generate random pubkey
  await queryFn(
    `INSERT INTO state_users
     (public_key, email, first_name, last_name, username, disabled)
     (SELECT UNHEX(SHA1(RAND())) as public_key, email, first_name, last_name, username, disabled
      FROM login_users
      WHERE email NOT IN (SELECT email from state_users)
      AND privkey IS NULL
     )`,
  )
  // Remove duplicate data from state_users with dead pubkeys
  // 18 entries
  await queryFn(
    `DELETE FROM state_users
    WHERE id IN (
      SELECT id FROM (
        SELECT id FROM state_users
        WHERE public_key NOT IN (
          SELECT pubkey FROM login_users
          WHERE pubkey IS NOT NULL
        )
        AND email IN (
          SELECT email FROM state_users
          GROUP BY email
          HAVING COUNT(*) > 1
        )
      ) AS subquery
    )`,
  )
}

export async function downgrade(
  /* queryFn: (query: string, values?: any[]) => Promise<Array<any>> */
) {
  // cannot undelete things
}
