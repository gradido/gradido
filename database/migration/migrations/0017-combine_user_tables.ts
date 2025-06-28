/* MIGRATION TO COMBINE LOGIN_USERS WITH STATE_USERS TABLE
 *
 * This migration combines the table `login_users` with
 * the `state_users` table, where the later is the target.
 */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // Drop column `group_id` since it contains uniform data which is not the same as the uniform data
  // on login_users. Since we do not need this data anyway, we sjust throw it away.
  await queryFn('ALTER TABLE `state_users` DROP COLUMN `group_id`;')

  // Remove the unique constraint from the pubkey
  await queryFn('ALTER TABLE `state_users` DROP INDEX `public_key`;')

  // Allow NULL on the `state_users` pubkey like it is allowed on `login_users`
  await queryFn('ALTER TABLE `state_users` MODIFY COLUMN `public_key` binary(32) DEFAULT NULL;')

  // instead use a unique constraint for the email like on `login_users`
  // therefore do not allow null on `email` anymore
  await queryFn(
    'ALTER TABLE `state_users` MODIFY COLUMN `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL;',
  )
  await queryFn('ALTER TABLE `state_users` ADD CONSTRAINT `email` UNIQUE KEY (`email`);')

  // Create `login_user_id` column - to store the login_users.id field to not break references.
  await queryFn(
    'ALTER TABLE `state_users` ADD COLUMN `login_user_id` int(10) unsigned DEFAULT NULL AFTER `id`;',
  )

  // Create missing data columns for the data stored in `login_users`
  await queryFn(
    "ALTER TABLE `state_users` ADD COLUMN `description` mediumtext COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER `disabled`;",
  )
  await queryFn(
    'ALTER TABLE `state_users` ADD COLUMN `password` bigint(20) unsigned DEFAULT 0 AFTER `description`;',
  )
  await queryFn(
    'ALTER TABLE `state_users` ADD COLUMN `privkey` binary(80) DEFAULT NULL AFTER `public_key`;',
  )
  await queryFn(
    'ALTER TABLE `state_users` ADD COLUMN `email_hash` binary(32) DEFAULT NULL AFTER `password`;',
  )
  await queryFn(
    'ALTER TABLE `state_users` ADD COLUMN `created` datetime NOT NULL DEFAULT current_timestamp() AFTER `email_hash`;',
  )
  await queryFn(
    'ALTER TABLE `state_users` ADD COLUMN `email_checked` tinyint(4) NOT NULL DEFAULT 0 AFTER `created`;',
  )
  await queryFn(
    'ALTER TABLE `state_users` ADD COLUMN `passphrase_shown` tinyint(4) NOT NULL DEFAULT 0 AFTER `email_checked`;',
  )
  await queryFn(
    "ALTER TABLE `state_users` ADD COLUMN `language` varchar(4) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'de' AFTER `passphrase_shown`;",
  )
  await queryFn(
    'ALTER TABLE `state_users` ADD COLUMN `publisher_id` int(11) DEFAULT 0 AFTER `language`;',
  )

  // Move data from `login_users` to the newly modified `state_users` table.
  // The following rules for overwriting data applies:
  // email      is the matching criteria
  // public_key is overwritten by `login_users`.`pubkey` (we have validated the passphrases here) (2 keys differ)
  // first_name is more accurate on `state_users` and stays unchanged (1 users with different first_* & last_name)
  // last_name  is more accurate on `state_users` and stays unchanged (1 users with different first_* & last_name)
  // username   does not contain any relevant data, either NULL or '' and therefore we do not change anything here
  // disabled   does not differ, we can omit it
  await queryFn(`
    UPDATE state_users
    LEFT JOIN login_users ON state_users.email = login_users.email
    SET state_users.public_key = login_users.pubkey,
        state_users.login_user_id = login_users.id,
        state_users.description = login_users.description,
        state_users.password = login_users.password,
        state_users.privkey = login_users.privkey,
        state_users.email_hash = login_users.email_hash,
        state_users.created = login_users.created,
        state_users.email_checked = login_users.email_checked,
        state_users.passphrase_shown = login_users.passphrase_shown,
        state_users.language = login_users.language,
        state_users.publisher_id = login_users.publisher_id
    ;
  `)

  // Drop `login_users` table
  await queryFn('DROP TABLE `login_users`;')
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`
    CREATE TABLE \`login_users\` (
      \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
      \`email\` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
      \`first_name\` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
      \`last_name\` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT '',
      \`username\` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT '',
      \`description\` mediumtext COLLATE utf8mb4_unicode_ci DEFAULT NULL,
      \`password\` bigint(20) unsigned DEFAULT 0,
      \`pubkey\` binary(32) DEFAULT NULL,
      \`privkey\` binary(80) DEFAULT NULL,
      \`email_hash\` binary(32) DEFAULT NULL,
      \`created\` datetime NOT NULL DEFAULT current_timestamp(),
      \`email_checked\` tinyint(4) NOT NULL DEFAULT 0,
      \`passphrase_shown\` tinyint(4) NOT NULL DEFAULT 0,
      \`language\` varchar(4) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'de',
      \`disabled\` tinyint(4) DEFAULT 0,
      \`group_id\` int(10) unsigned DEFAULT 0,
      \`publisher_id\` int(11) DEFAULT 0,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`email\` (\`email\`)
    ) ENGINE=InnoDB AUTO_INCREMENT=2363 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `)
  await queryFn(`
    INSERT INTO login_users 
      ( id, email, first_name, last_name, username,
        description, password, pubkey, privkey, email_hash,
        created, email_checked, passphrase_shown, language,
        disabled, group_id, publisher_id )
      ( SELECT login_user_id AS id, email, first_name,
               last_name, username, description, password,
               public_key AS pubkey, privkey, email_hash,
               created, email_checked, passphrase_shown,
               language, disabled, '1' AS group_id,
               publisher_id
       FROM state_users )
    ;
  `)
  await queryFn('ALTER TABLE `state_users` DROP COLUMN `publisher_id`;')
  await queryFn('ALTER TABLE `state_users` DROP COLUMN `language`;')
  await queryFn('ALTER TABLE `state_users` DROP COLUMN `passphrase_shown`;')
  await queryFn('ALTER TABLE `state_users` DROP COLUMN `email_checked`;')
  await queryFn('ALTER TABLE `state_users` DROP COLUMN `created`;')
  await queryFn('ALTER TABLE `state_users` DROP COLUMN `email_hash`;')
  await queryFn('ALTER TABLE `state_users` DROP COLUMN `privkey`;')
  await queryFn('ALTER TABLE `state_users` DROP COLUMN `password`;')
  await queryFn('ALTER TABLE `state_users` DROP COLUMN `description`;')
  await queryFn('ALTER TABLE `state_users` DROP COLUMN `login_user_id`;')
  await queryFn('ALTER TABLE `state_users` DROP INDEX `email`;')
  await queryFn(
    'ALTER TABLE `state_users` MODIFY COLUMN `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL;',
  )
  // Note: if the public_key is NULL, we need to set a random key in order to meet the constraint
  await queryFn(
    'UPDATE `state_users` SET public_key = UNHEX(SHA1(RAND())) WHERE public_key IS NULL;',
  )
  await queryFn('ALTER TABLE `state_users` MODIFY COLUMN `public_key` binary(32) NOT NULL;')
  await queryFn('ALTER TABLE `state_users` ADD CONSTRAINT `public_key` UNIQUE KEY (`public_key`);')
  await queryFn(
    'ALTER TABLE `state_users` ADD COLUMN `group_id` int(10) unsigned NOT NULL DEFAULT 0 AFTER index_id;',
  )
}
