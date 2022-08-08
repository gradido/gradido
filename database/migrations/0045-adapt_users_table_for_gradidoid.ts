/* MIGRATION TO ADD GRADIDO_ID
 *
 * This migration adds new columns to the table `users` and creates the
 * new table `user_contacts`
 */

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { v4 as uuidv4 } from 'uuid'

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  /*
  await queryFn(`
    CREATE FUNCTION uuid_v4s()
       RETURNS CHAR(36)
    BEGIN
        -- 1th and 2nd block are made of 6 random bytes
        SET @h1 = HEX(RANDOM_BYTES(4));
        SET @h2 = HEX(RANDOM_BYTES(2));
    
        -- 3th block will start with a 4 indicating the version, remaining is random
        SET @h3 = SUBSTR(HEX(RANDOM_BYTES(2)), 2, 3);
    
        -- 4th block first nibble can only be 8, 9 A or B, remaining is random
        SET @h4 = CONCAT(HEX(FLOOR(ASCII(RANDOM_BYTES(1)) / 64)+8),
                    SUBSTR(HEX(RANDOM_BYTES(2)), 2, 3));
    
        -- 5th block is made of 6 random bytes
        SET @h5 = HEX(RANDOM_BYTES(6));
    
        -- Build the complete UUID
        RETURN LOWER(CONCAT(
            @h1, '-', @h2, '-4', @h3, '-', @h4, '-', @h5
        ));
    END`)



 SELECT LOWER(CONCAT(
 HEX(RANDOM_BYTES(4)), '-',
 HEX(RANDOM_BYTES(2)), '-4',
 SUBSTR(HEX(RANDOM_BYTES(2)), 2, 3), '-',
 CONCAT(HEX(FLOOR(ASCII(RANDOM_BYTES(1)) / 64)+8),SUBSTR(HEX(RANDOM_BYTES(2)), 2, 3)), '-',
 HEX(RANDOM_BYTES(6))


  await queryFn(
    `CREATE FUNCTION UuidToBin(_uuid BINARY(36))
        RETURNS BINARY(16)
        LANGUAGE SQL  DETERMINISTIC  CONTAINS SQL  SQL SECURITY INVOKER
     RETURN
        UNHEX(CONCAT(
            SUBSTR(_uuid, 15, 4),
            SUBSTR(_uuid, 10, 4),
            SUBSTR(_uuid,  1, 8),
            SUBSTR(_uuid, 20, 4),
            SUBSTR(_uuid, 25) ));
    //
    CREATE FUNCTION UuidFromBin(_bin BINARY(16))
        RETURNS BINARY(36)
        LANGUAGE SQL  DETERMINISTIC  CONTAINS SQL  SQL SECURITY INVOKER
    RETURN
        LCASE(CONCAT_WS('-',
            HEX(SUBSTR(_bin,  5, 4)),
            HEX(SUBSTR(_bin,  3, 2)),
            HEX(SUBSTR(_bin,  1, 2)),
            HEX(SUBSTR(_bin,  9, 2)),
            HEX(SUBSTR(_bin, 11))
                 ));

    //
    DELIMITER ;    


    
    CREATE FUNCTION BIN_TO_UUID(b BINARY(16))
    RETURNS CHAR(36)
    BEGIN
       DECLARE hexStr CHAR(32);
       SET hexStr = HEX(b);
       RETURN LOWER(CONCAT(
            SUBSTR(hexStr, 1, 8), '-',
            SUBSTR(hexStr, 9, 4), '-',
            SUBSTR(hexStr, 13, 4), '-',
            SUBSTR(hexStr, 17, 4), '-',
            SUBSTR(hexStr, 21)
        ));
    END `)

  await queryFn(`   DELIMITER ;`)

  await queryFn(`DELIMITER $$
    
    CREATE FUNCTION UUID_TO_BIN(uuid CHAR(36))
    RETURNS BINARY(16)
    BEGIN
        RETURN UNHEX(REPLACE(uuid, '-', ''));
    END

    $$
    
    DELIMITER ;`)
*/

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
  // console.log('user_contacts created...')

  // First add gradido_id as nullable column without Default
  await queryFn('ALTER TABLE `users` ADD COLUMN `gradido_id` CHAR(36) NULL AFTER `id`;')
  // console.log('users.gradido_id added...\n')

  // Second update gradido_id with ensured unique uuidv4
  // console.log('search for all users with gradido_id is null...\n')
  const usersToUpdate = await queryFn('SELECT `id`, `gradido_id` FROM `users`') //  WHERE 'u.gradido_id' is null`,)
  for (const id in usersToUpdate) {
    const user = usersToUpdate[id]
    // console.log('found user: %s\n', user)
    let gradidoId = null
    let countIds = null
    do {
      gradidoId = uuidv4()
      // console.log('uuid: %s\n', gradidoId)
      countIds = await queryFn(
        `SELECT COUNT(*) FROM \`users\` WHERE \`gradido_id\` = "${gradidoId}"`,
      )
      // console.log('found uuids: %d\n', countIds[0])
    } while (countIds[0] > 0)
    await queryFn(
      `UPDATE \`users\` SET \`gradido_id\` = "${gradidoId}" WHERE \`id\` = "${user.id}"`,
    )
    // console.log('update user with id=%d and gradidoId=%s\n', user.id, gradidoId)
  }

  // third modify gradido_id to not nullable and unique
  await queryFn('ALTER TABLE `users` MODIFY COLUMN `gradido_id` CHAR(36) NOT NULL UNIQUE;')
  // console.log('alter users.gradido_id to NOT NULL and UNIQUE...\n')

  await queryFn(
    'ALTER TABLE `users` ADD COLUMN `alias` varchar(20) NULL UNIQUE AFTER `gradido_id`;',
  )
  // console.log('users.alias added...\n')

  await queryFn('ALTER TABLE `users` ADD COLUMN `email_id` int(10) NULL AFTER `email`;')
  // console.log('users.email_id added...\n')

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
  // console.log('user_contacts inserted...\n')

  // insert in users table the email_id of the new created email-contacts
  const contacts = await queryFn(`SELECT c.id, c.user_id FROM user_contacts as c`)
  for (const id in contacts) {
    const contact = contacts[id]
    // console.log('found contact: %s\n', contact)
    await queryFn(
      `UPDATE users as u SET u.email_id = "${contact.id}" WHERE u.id = "${contact.user_id}"`,
    )
    // console.log('update users with id=%d and email_id=%d\n', contact.user_id, contact.id)
  }
  // console.log('upgrade finished...\n')
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // write downgrade logic as parameter of queryFn
  await queryFn(`DROP TABLE IF EXISTS user_contacts;`)

  await queryFn('ALTER TABLE users DROP COLUMN gradido_id;')
  await queryFn('ALTER TABLE users DROP COLUMN alias;')
  await queryFn('ALTER TABLE users DROP COLUMN email_id;')
}
