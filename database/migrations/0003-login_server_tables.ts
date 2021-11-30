/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

/* FIRST MIGRATION
 *
 * This migration is special since it takes into account that
 * the database can be setup already but also may not be.
 * Therefore you will find all `CREATE TABLE` statements with
 * a `IF NOT EXISTS`, all `INSERT` with an `IGNORE` and in the
 * downgrade function all `DROP TABLE` with a `IF EXISTS`.
 * This ensures compatibility for existing or non-existing
 * databases.
 */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`
    CREATE TABLE \`login_app_access_tokens\` (
      \`id\` int unsigned NOT NULL AUTO_INCREMENT,
      \`user_id\` int NOT NULL,
      \`access_code\` bigint unsigned NOT NULL,
      \`created\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`access_code\` (\`access_code\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `)
  await queryFn(`
    CREATE TABLE \`login_elopage_buys\` (
      \`id\` int unsigned NOT NULL AUTO_INCREMENT,
      \`elopage_user_id\` int DEFAULT NULL,
      \`affiliate_program_id\` int NOT NULL,
      \`publisher_id\` int NOT NULL,
      \`order_id\` int NOT NULL,
      \`product_id\` int NOT NULL,
      \`product_price\` int NOT NULL,
      \`payer_email\` varchar(255) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
      \`publisher_email\` varchar(255) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
      \`payed\` tinyint NOT NULL,
      \`success_date\` datetime NOT NULL,
      \`event\` varchar(255) NOT NULL,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `)
  await queryFn(`
    CREATE TABLE \`login_email_opt_in_types\` (
      \`id\` int unsigned NOT NULL AUTO_INCREMENT,
      \`name\` varchar(255) NOT NULL,
      \`description\` varchar(255) NOT NULL,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `)
  await queryFn(`
    CREATE TABLE \`login_email_opt_in\` (
      \`id\` int unsigned NOT NULL AUTO_INCREMENT,
      \`user_id\` int NOT NULL,
      \`verification_code\` bigint unsigned NOT NULL,
      \`email_opt_in_type_id\` int NOT NULL,
      \`created\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`resend_count\` int DEFAULT '0',
      \`updated\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`verification_code\` (\`verification_code\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `)
  await queryFn(`
    CREATE TABLE \`login_groups\` (
      \`id\` int unsigned NOT NULL AUTO_INCREMENT,
      \`alias\` varchar(190) NOT NULL,
      \`name\` varchar(255) NOT NULL,
      \`url\` varchar(255) NOT NULL,
      \`host\` varchar(255) DEFAULT "/",
      \`home\` varchar(255) DEFAULT "/",
      \`description\` text,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`alias\` (\`alias\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4; 
  `)
  await queryFn(`
    CREATE TABLE \`login_pending_tasks\` (
      \`id\` int UNSIGNED NOT NULL AUTO_INCREMENT,
      \`user_id\` int UNSIGNED DEFAULT 0,
      \`request\` varbinary(2048) NOT NULL,
      \`created\` datetime NOT NULL,
      \`finished\` datetime DEFAULT '2000-01-01 000000',
      \`result_json\` text DEFAULT NULL,
      \`param_json\` text DEFAULT NULL,
      \`task_type_id\` int UNSIGNED NOT NULL,
      \`child_pending_task_id\` int UNSIGNED DEFAULT 0,
      \`parent_pending_task_id\` int UNSIGNED DEFAULT 0,
      PRIMARY KEY (\`id\`)
    ) ENGINE = InnoDB DEFAULT CHARSET=utf8mb4;
  `)
  await queryFn(`
    CREATE TABLE \`login_roles\` (
      \`id\` int unsigned NOT NULL AUTO_INCREMENT,
      \`name\` varchar(255) NOT NULL,
      \`description\` varchar(255) NOT NULL,
      \`flags\` bigint NOT NULL DEFAULT '0',
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `)
  await queryFn(`
    CREATE TABLE \`login_user_backups\` (
      \`id\` int unsigned NOT NULL AUTO_INCREMENT,
      \`user_id\` int NOT NULL,
      \`passphrase\` text NOT NULL,
      \`mnemonic_type\` int DEFAULT '-1',
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `)
  await queryFn(`
    CREATE TABLE \`login_user_roles\` (
      \`id\` int unsigned NOT NULL AUTO_INCREMENT,
      \`user_id\` int NOT NULL,
      \`role_id\` int NOT NULL,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `)
  await queryFn(`
    CREATE TABLE \`login_users\` (
      \`id\` int unsigned NOT NULL AUTO_INCREMENT,
      \`email\` varchar(191) NOT NULL,
      \`first_name\` varchar(150) NOT NULL,
      \`last_name\` varchar(255) DEFAULT '',
      \`username\` varchar(255) DEFAULT '',
      \`description\` text DEFAULT '',
      \`password\` bigint unsigned DEFAULT '0',
      \`pubkey\` binary(32) DEFAULT NULL,
      \`privkey\` binary(80) DEFAULT NULL,
      \`email_hash\` binary(32) DEFAULT NULL,
      \`created\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`email_checked\` tinyint NOT NULL DEFAULT '0',
      \`passphrase_shown\` tinyint NOT NULL DEFAULT '0',
      \`language\` varchar(4) NOT NULL DEFAULT 'de',
      \`disabled\` tinyint DEFAULT '0',
      \`group_id\` int unsigned DEFAULT 0,
      \`publisher_id\` int DEFAULT 0,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`email\` (\`email\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `)
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // write downgrade logic as parameter of queryFn
  await queryFn(`DROP TABLE \`login_app_access_tokens\`;`)
  await queryFn(`DROP TABLE \`login_elopage_buys\`;`)
  await queryFn(`DROP TABLE \`login_email_opt_in_types\`;`)
  await queryFn(`DROP TABLE \`login_email_opt_in\`;`)
  await queryFn(`DROP TABLE \`login_groups\`;`)
  await queryFn(`DROP TABLE \`login_pending_tasks\`;`)
  await queryFn(`DROP TABLE \`login_roles\`;`)
  await queryFn(`DROP TABLE \`login_user_backups\`;`)
  await queryFn(`DROP TABLE \`login_user_roles\`;`)
  await queryFn(`DROP TABLE \`login_users\`;`)
}
