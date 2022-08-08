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
        \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`deleted_at\` datetime NULL DEFAULT NULL,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`)

  // First add gradido_id as nullable column without Default
  await queryFn('ALTER TABLE `users` ADD COLUMN `gradido_id` CHAR(36) NULL AFTER `id`;')

  // Second update gradido_id with ensured unique uuidv4
  const usersToUpdate = await queryFn('SELECT `id`, `gradido_id` FROM `users`') //  WHERE 'u.gradido_id' is null`,)
  for (const id in usersToUpdate) {
    const user = usersToUpdate[id]
    let gradidoId = null
    let countIds = null
    do {
      gradidoId = uuidv4()
      countIds = await queryFn(
        `SELECT COUNT(*) FROM \`users\` WHERE \`gradido_id\` = "${gradidoId}"`,
      )
    } while (countIds[0] > 0)
    await queryFn(
      `UPDATE \`users\` SET \`gradido_id\` = "${gradidoId}" WHERE \`id\` = "${user.id}"`,
    )
  }

  // third modify gradido_id to not nullable and unique
  await queryFn('ALTER TABLE `users` MODIFY COLUMN `gradido_id` CHAR(36) NOT NULL UNIQUE;')

  await queryFn(
    'ALTER TABLE `users` ADD COLUMN `alias` varchar(20) NULL UNIQUE AFTER `gradido_id`;',
  )

  await queryFn('ALTER TABLE `users` ADD COLUMN `email_id` int(10) NULL AFTER `email`;')

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
  // this step comes after verification and test
  await queryFn('ALTER TABLE users DROP COLUMN email;')
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // reconstruct the previous email back from contacts to users table
  await queryFn('ALTER TABLE users ADD COLUMN email varchar(255) NULL AFTER privkey;')
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

  await queryFn('ALTER TABLE users DROP COLUMN gradido_id;')
  await queryFn('ALTER TABLE users DROP COLUMN alias;')
  await queryFn('ALTER TABLE users DROP COLUMN email_id;')
}
