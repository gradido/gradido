/* MIGRATION TO DROP UNUSED TABLES
 *
 * This migration removes all tables without data and entity definition.
 * Base for evaluation are the production data from 27.01.2022 which had 40 tables present
 * The migration reduces the amount of tables to 28
 */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`DROP TABLE \`login_app_access_tokens\`;`)
  await queryFn(`DROP TABLE \`pending_transactions\`;`)
  await queryFn(`DROP TABLE \`roles\`;`)
  await queryFn(`DROP TABLE \`state_created\`;`)
  await queryFn(`DROP TABLE \`state_groups\`;`)
  await queryFn(`DROP TABLE \`state_group_addresses\`;`)
  await queryFn(`DROP TABLE \`state_group_relationships\`;`)
  await queryFn(`DROP TABLE \`state_relationship_types\`;`)
  await queryFn(`DROP TABLE \`state_user_roles\`;`)
  await queryFn(`DROP TABLE \`transaction_group_addaddress\`;`)
  await queryFn(`DROP TABLE \`transaction_group_allowtrades\`;`)
  await queryFn(`DROP TABLE \`transaction_group_creates\`;`)
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`
    CREATE TABLE IF NOT EXISTS \`login_app_access_tokens\` (
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
    CREATE TABLE \`pending_transactions\` (
      \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
      \`transactionID\` varchar(25) COLLATE utf8mb4_unicode_ci NOT NULL,
      \`service\` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
      \`method\` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
      \`h_server_id\` int(11) NOT NULL,
      \`timeout\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`transactionID\` (\`transactionID\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `)
  await queryFn(`
    CREATE TABLE \`roles\` (
      \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
      \`title\` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `)
  await queryFn(`
    CREATE TABLE \`state_created\` (
      \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
      \`transaction_id\` int(10) unsigned NOT NULL,
      \`month\` tinyint(3) unsigned NOT NULL,
      \`year\` smallint(5) unsigned NOT NULL,
      \`state_user_id\` int(10) unsigned NOT NULL,
      \`created\` datetime NOT NULL,
      \`short_ident_hash\` int(10) unsigned NOT NULL,
      PRIMARY KEY (\`id\`),
      KEY \`short_ident_hash\` (\`short_ident_hash\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `)
  await queryFn(`
    CREATE TABLE \`state_groups\` (
      \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
      \`index_id\` varbinary(64) NOT NULL,
      \`name\` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
      \`root_public_key\` binary(32) NOT NULL,
      \`user_count\` smallint(5) unsigned NOT NULL DEFAULT 0,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `)
  await queryFn(`
    CREATE TABLE \`state_group_addresses\` (
      \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
      \`group_id\` int(10) unsigned NOT NULL,
      \`public_key\` binary(32) NOT NULL,
      \`address_type_id\` int(10) unsigned NOT NULL,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`public_key\` (\`public_key\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `)
  await queryFn(`
    CREATE TABLE \`state_group_relationships\` (
      \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
      \`group1_id\` int(10) unsigned NOT NULL,
      \`group2_id\` int(10) unsigned NOT NULL,
      \`state_relationship_id\` int(10) unsigned NOT NULL,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `)
  await queryFn(`
    CREATE TABLE \`state_relationship_types\` (
      \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
      \`name\` varchar(25) COLLATE utf8mb4_unicode_ci NOT NULL,
      \`text\` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `)
  await queryFn(`
    CREATE TABLE \`state_user_roles\` (
      \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
      \`state_user_id\` int(11) NOT NULL,
      \`role_id\` int(11) NOT NULL,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `)
  await queryFn(`
    CREATE TABLE \`transaction_group_addaddress\` (
      \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
      \`transaction_id\` int(10) unsigned NOT NULL,
      \`address_type_id\` int(10) unsigned NOT NULL,
      \`remove_from_group\` tinyint(1) DEFAULT 0,
      \`public_key\` binary(32) NOT NULL,
      \`state_user_id\` int(10) unsigned NOT NULL,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `)
  await queryFn(`
    CREATE TABLE \`transaction_group_allowtrades\` (
      \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
      \`transaction_id\` int(10) unsigned NOT NULL,
      \`remote_group_id\` varbinary(64) NOT NULL,
      \`allow\` tinyint(4) NOT NULL DEFAULT 0,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `)
  await queryFn(`
    CREATE TABLE \`transaction_group_creates\` (
      \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
      \`transaction_id\` int(10) unsigned NOT NULL,
      \`group_public_key\` binary(32) NOT NULL,
      \`group_id\` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
      \`name\` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `)
}
