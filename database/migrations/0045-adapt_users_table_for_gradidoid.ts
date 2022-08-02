/* MIGRATION TO ADD GRADIDO_ID
 *
 * This migration adds new columns to the table `users` and creates the
 * new table `user_contacts`
 */

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`
    CREATE FUNCTION UuidToBin(_uuid BINARY(36))
        RETURNS BINARY(16)
        LANGUAGE SQL  DETERMINISTIC  CONTAINS SQL  SQL SECURITY INVOKER
    RETURN
        UNHEX(CONCAT(
            SUBSTR(_uuid, 15, 4),
            SUBSTR(_uuid, 10, 4),
            SUBSTR(_uuid,  1, 8),
            SUBSTR(_uuid, 20, 4),
            SUBSTR(_uuid, 25) ));`)

  await queryFn(`
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
            ));`)

  await queryFn(`
      CREATE TABLE IF NOT EXISTS \`user_contacts\` (
        \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
        \`type\` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
        \`user_id\` int(10) unsigned NOT NULL,
        \`email\` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
        \`email_verification_code\` bigint(20) unsigned NOT NULL,
        \`email_opt_in_type_id\` int NOT NULL,
        \`email_resend_count\` int DEFAULT '0',
        \`email_checked\` tinyint(4) NOT NULL DEFAULT 0,
        \`phone\` varchar(255) COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
        \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`deleted_at\` datetime NULL DEFAULT NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`email_verification_code\` (\`email_verification_code\`),
        UNIQUE KEY \`email\` (\`email\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`)

  await queryFn(
    'ALTER TABLE `users` ADD COLUMN `gradido_id` BINARY(16) NOT NULL UNIQUE DEFAULT UuidToBin(UUID()) AFTER `id`;',
  )
  await queryFn(
    'ALTER TABLE `users` ADD COLUMN `alias` varchar(20) NULL UNIQUE AFTER `gradido_id`;',
  )
  await queryFn('ALTER TABLE `users` ADD COLUMN `email_id` int(10) NULL AFTER `email`;')
  await queryFn(`
  INSERT INTO gradido_community.user_contacts
  (type, user_id, email, email_verification_code, email_opt_in_type_id, email_resent_count, email_checked, created_at, updated_at, deleted_at)
  SELECT 
    'EMAIL' as type, 
     u.id as user_id,
     u.email,
     e.verification_code,
     e.email_opt_in_type_id,
     e.resend_count,
     u.email_checked,
     e.created,
     e.updated,
     u.deletedAt
   FROM 
     gradido_community.users as u, 
     gradido_community.login_email_opt_in as e 
   WHERE 
     u.id = e.user_id;`)
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // write downgrade logic as parameter of queryFn
  await queryFn(`DROP TABLE IF EXISTS \`user_contacts\`;`)

  await queryFn('ALTER TABLE `users` DROP COLUMN `gradido_id`;')
  await queryFn('ALTER TABLE `users` DROP COLUMN `alias`;')
  await queryFn('ALTER TABLE `users` DROP COLUMN `email_id`;')
}
