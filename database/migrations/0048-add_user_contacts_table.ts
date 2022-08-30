/* MIGRATION TO ADD GRADIDO_ID
 *
 * This migration adds new columns to the table `users` and creates the
 * new table `user_contacts`
 */

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { v4 as uuidv4 } from 'uuid'

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {

  await queryFn(`
      CREATE TABLE IF NOT EXISTS \`user_contacts\` (
        \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
        \`type\` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
        \`user_id\` int(10) unsigned NOT NULL,
        \`email\` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL UNIQUE,
        \`email_verification_code\` bigint(20) unsigned NOT NULL UNIQUE,
        \`email_opt_in_type_id\` int NOT NULL,
        \`email_resend_count\` int DEFAULT '0',
        \`email_checked\` tinyint(4) NOT NULL DEFAULT 0,
        \`phone\` varchar(255) COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
        \`created_at\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updated_at\` datetime(3) NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP(3),
        \`deleted_at\` datetime(3) NULL DEFAULT NULL,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`)

  await queryFn('ALTER TABLE `users` ADD COLUMN `email_id` int(10) NULL AFTER `email`;')
  // define datetime column with a precision of 3 milliseconds
  await queryFn(
    'ALTER TABLE `users` MODIFY COLUMN `created` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) AFTER `email_hash`;',
  )
  // define datetime column with a precision of 3 milliseconds
  await queryFn(
    'ALTER TABLE `users` MODIFY COLUMN `deletedAt` datetime(3) NULL DEFAULT NULL AFTER `last_name`;',
  )
  // define datetime column with a precision of 3 milliseconds
  await queryFn(
    'ALTER TABLE `users` MODIFY COLUMN `is_admin` datetime(3) NULL DEFAULT NULL AFTER `language`;',
  )

  // merge values from login_email_opt_in table with users.email in new user_contacts table
  await queryFn(`
  INSERT INTO user_contacts
  (type, user_id, email, email_verification_code, email_opt_in_type_id, email_resend_count, email_checked, created_at, updated_at, deleted_at)
  SELECT 
    'EMAIL', 
     u.id as user_id,
     u.email,
     e.verification_code as email_verification_code,
     e.email_opt_in_type_id,
     e.resend_count as email_resend_count,
     u.email_checked,
     e.created as created_at,
     e.updated as updated_at,
     u.deletedAt as deleted_at\
   FROM 
     users as u,
     login_email_opt_in as e
   WHERE 
     u.id = e.user_id;`)

  // insert in users table the email_id of the new created email-contacts
  const contacts = await queryFn(`SELECT c.id, c.user_id FROM user_contacts as c`)
  for (const id in contacts) {
    const contact = contacts[id]
    await queryFn(
      `UPDATE users as u SET u.email_id = "${contact.id}" WHERE u.id = "${contact.user_id}"`,
    )
  }
  // these steps comes after verification and test
  await queryFn('ALTER TABLE users DROP COLUMN email;')
  await queryFn('ALTER TABLE users DROP COLUMN email_checked;')
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // this step comes after verification and test
  await queryFn('ALTER TABLE users ADD COLUMN email varchar(255) NULL AFTER privkey;')
  await queryFn(
    'ALTER TABLE users ADD COLUMN email_checked tinyint(4) NOT NULL DEFAULT 0 AFTER email;',
  )
  await queryFn(
    'ALTER TABLE `users` MODIFY COLUMN `created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER `email_hash`;',
  )
  await queryFn(
    'ALTER TABLE `users` MODIFY COLUMN `deletedAt` datetime NULL DEFAULT NULL AFTER `last_name`;',
  )
  await queryFn(
    'ALTER TABLE `users` MODIFY COLUMN `is_admin` datetime NULL DEFAULT NULL AFTER `language`;',
  )

  // reconstruct the previous email back from contacts to users table
  const contacts = await queryFn(`SELECT c.id, c.email, c.user_id FROM user_contacts as c`)
  for (const id in contacts) {
    const contact = contacts[id]
    await queryFn(
      `UPDATE users SET email = "${contact.email}" WHERE id = "${contact.user_id}" and email_id = "${contact.id}"`,
    )
  }
  await queryFn('ALTER TABLE users MODIFY COLUMN email varchar(255) NOT NULL UNIQUE;')

  // write downgrade logic as parameter of queryFn
  await queryFn(`DROP TABLE IF EXISTS user_contacts;`)

  await queryFn('ALTER TABLE users DROP COLUMN email_id;')
}
