/* MIGRATION TO COMBINE LOGIN_BACKUP_USERS TABLE WITH STATE_USERS
 *
 * This migration combines the table `login_user_backups` into
 * the `state_users` table, where the later is the target.
 */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // We only keep the passphrase, the mnemonic type is a constant,
  // since every passphrase was converted to mnemonic type 2
  await queryFn(
    'ALTER TABLE `state_users` ADD COLUMN `passphrase` text DEFAULT NULL AFTER `publisher_id`;',
  )

  // Move data from `login_user_backups` to the newly modified `state_users` table.
  await queryFn(`
    UPDATE state_users
    LEFT JOIN login_user_backups ON state_users.login_user_id = login_user_backups.user_id
    SET state_users.passphrase = login_user_backups.passphrase
    WHERE login_user_backups.passphrase IS NOT NULL
    ;
  `)

  // Drop `login_user_backups` table
  await queryFn('DROP TABLE `login_user_backups`;')
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`
    CREATE TABLE \`login_user_backups\` (
      \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
      \`user_id\` int(11) NOT NULL,
      \`passphrase\` text NOT NULL,
      \`mnemonic_type\` int(11) DEFAULT -1,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB AUTO_INCREMENT=1862 DEFAULT CHARSET=utf8mb4;
  `)
  await queryFn(`
    INSERT INTO login_user_backups
      ( user_id, passphrase, mnemonic_type )
      ( SELECT login_user_id AS user_id,
               passphrase,
               '2' as mnemonic_type
        FROM state_users
        WHERE passphrase IS NOT NULL )
    ;
  `)
  await queryFn('ALTER TABLE `state_users` DROP COLUMN `passphrase`;')
}
