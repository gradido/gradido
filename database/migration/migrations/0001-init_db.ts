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
  // write upgrade logic as parameter of queryFn
  await queryFn(`
    CREATE TABLE IF NOT EXISTS \`address_types\` (
      \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
      \`name\` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
      \`text\` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `)
  await queryFn(`
    INSERT IGNORE INTO \`address_types\` (\`id\`, \`name\`, \`text\`) VALUES
      (1, 'user main', 'user main address');`)

  await queryFn(`
    CREATE TABLE IF NOT EXISTS \`admin_errors\` (
      \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
      \`state_user_id\` int(11) NOT NULL,
      \`controller\` varchar(255) NOT NULL,
      \`action\` varchar(255) NOT NULL,
      \`state\` varchar(255) NOT NULL,
      \`msg\` varchar(255) NOT NULL,
      \`details\` varchar(255) DEFAULT NULL,
      \`created\` datetime NOT NULL,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`)

  await queryFn(`
    CREATE TABLE IF NOT EXISTS \`blockchain_types\` (
      \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
      \`name\` varchar(45) NOT NULL,
      \`text\` varchar(255) NULL,
      \`symbol\` varchar(10) NULL,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`)
  await queryFn(`
    INSERT IGNORE INTO \`blockchain_types\` (\`id\`, \`name\`, \`text\`, \`symbol\`) VALUES
      (1, 'mysql', 'use mysql db as blockchain, work only with single community-server', NULL),
      (2, 'hedera', 'use hedera for transactions', 'HBAR');`)

  await queryFn(`
    CREATE TABLE IF NOT EXISTS \`community_profiles\` (
      \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
      \`state_user_id\` int(10) unsigned NOT NULL,
      \`profile_img\` longblob,
      \`profile_desc\` varchar(2000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
      PRIMARY KEY (\`id\`),
      KEY \`state_user_id\` (\`state_user_id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`)

  await queryFn(`
    CREATE TABLE IF NOT EXISTS \`operator_types\` (
      \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
      \`name\` varchar(25) COLLATE utf8mb4_unicode_ci NOT NULL,
      \`text\` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`)

  await queryFn(`
    CREATE TABLE IF NOT EXISTS \`operators\` (
      \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
      \`username\` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
      \`user_pubkey\` binary(32) NOT NULL,
      \`data_base64\` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
      \`modified\` datetime NOT NULL,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`)

  await queryFn(`
    CREATE TABLE IF NOT EXISTS \`pending_transactions\` (
      \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
      \`transactionID\` varchar(25) COLLATE utf8mb4_unicode_ci NOT NULL,
      \`service\` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
      \`method\` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
      \`h_server_id\` int(11) NOT NULL,
      \`timeout\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`transactionID\` (\`transactionID\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`)

  await queryFn(`
    CREATE TABLE IF NOT EXISTS \`roles\` (
      \`id\` int UNSIGNED NOT NULL AUTO_INCREMENT,
      \`title\` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`)

  await queryFn(`
    CREATE TABLE IF NOT EXISTS \`server_users\` (
      \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
      \`username\` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
      \`password\` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
      \`email\` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
      \`role\` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'admin',
      \`activated\` tinyint(4) NOT NULL DEFAULT '0',
      \`last_login\` datetime DEFAULT NULL,
      \`created\` datetime NOT NULL,
      \`modified\` datetime NOT NULL,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`)

  await queryFn(`
    CREATE TABLE IF NOT EXISTS \`state_balances\` (
      \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
      \`state_user_id\` int(10) unsigned NOT NULL,
      \`modified\` datetime NOT NULL,
      \`record_date\`datetime NULL,
      \`amount\` bigint(20) NOT NULL,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`)

  await queryFn(`
    CREATE TABLE IF NOT EXISTS \`state_created\` (
      \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
      \`transaction_id\` int(10) unsigned NOT NULL,
      \`month\` tinyint(3) unsigned NOT NULL,
      \`year\` smallint(5) unsigned NOT NULL,
      \`state_user_id\` int(10) unsigned NOT NULL,
      \`created\` datetime NOT NULL,
      \`short_ident_hash\` int(10) unsigned NOT NULL,
      PRIMARY KEY (\`id\`),
      KEY \`short_ident_hash\` (\`short_ident_hash\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`)

  await queryFn(`
    CREATE TABLE IF NOT EXISTS \`state_errors\` (
      \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
      \`state_user_id\` int(10) unsigned NOT NULL,
      \`transaction_type_id\` int(10) unsigned NOT NULL,
      \`created\` datetime NOT NULL,
      \`message_json\` text COLLATE utf8mb4_unicode_ci NOT NULL,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`)

  await queryFn(`
    CREATE TABLE IF NOT EXISTS \`state_group_addresses\` (
      \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
      \`group_id\` int(10) unsigned NOT NULL,
      \`public_key\` binary(32) NOT NULL,
      \`address_type_id\` int(10) unsigned NOT NULL,
      PRIMARY KEY (\`id\`),
      UNIQUE(\`public_key\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`)

  await queryFn(`
    CREATE TABLE IF NOT EXISTS \`state_group_relationships\` (
      \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
      \`group1_id\` int(10) unsigned NOT NULL,
      \`group2_id\` int(10) unsigned NOT NULL,
      \`state_relationship_id\` int(10) unsigned NOT NULL,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`)

  await queryFn(`
    CREATE TABLE IF NOT EXISTS \`state_groups\` (
      \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
      \`index_id\` varbinary(64) NOT NULL,
      \`name\` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
      \`root_public_key\` binary(32) NOT NULL,
      \`user_count\` smallint(5) unsigned NOT NULL DEFAULT '0',
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`)

  await queryFn(`
    CREATE TABLE IF NOT EXISTS \`state_relationship_types\` (
      \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
      \`name\` varchar(25) COLLATE utf8mb4_unicode_ci NOT NULL,
      \`text\` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`)

  await queryFn(`
    CREATE TABLE IF NOT EXISTS \`state_user_roles\` (
      \`id\` int UNSIGNED NOT NULL AUTO_INCREMENT,
      \`state_user_id\` int(11) NOT NULL,
      \`role_id\` int(11) NOT NULL,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`)

  await queryFn(`
    CREATE TABLE IF NOT EXISTS \`state_user_transactions\` (
      \`id\` int UNSIGNED NOT NULL AUTO_INCREMENT,
      \`state_user_id\` int UNSIGNED NOT NULL,
      \`transaction_id\` int UNSIGNED NOT NULL,
      \`transaction_type_id\` int UNSIGNED NOT NULL,
      \`balance\` bigint(20) DEFAULT 0,
      \`balance_date\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`)

  await queryFn(`
    CREATE TABLE IF NOT EXISTS \`state_users\` (
      \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
      \`index_id\` smallint(6) NOT NULL DEFAULT '0',
      \`group_id\` int(10) unsigned NOT NULL DEFAULT '0',
      \`public_key\` binary(32) NOT NULL,
      \`email\` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
      \`first_name\` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
      \`last_name\` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
      \`username\` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
      \`disabled\` tinyint(4) DEFAULT '0',
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`public_key\` (\`public_key\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`)

  await queryFn(`
    CREATE TABLE IF NOT EXISTS \`transaction_creations\` (
      \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
      \`transaction_id\` int(10) unsigned NOT NULL,
      \`state_user_id\` int(10) unsigned NOT NULL,
      \`amount\` bigint(20) NOT NULL,
      \`ident_hash\` binary(32) NULL,
      \`target_date\` timestamp NULL DEFAULT NULL,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `)

  await queryFn(`
    CREATE TABLE IF NOT EXISTS \`transaction_group_addaddress\` (
      \`id\` int unsigned NOT NULL AUTO_INCREMENT,
      \`transaction_id\` int unsigned NOT NULL,
      \`address_type_id\` int unsigned NOT NULL,
      \`remove_from_group\` BOOLEAN DEFAULT FALSE,
      \`public_key\` binary(32) NOT NULL,
      \`state_user_id\` int unsigned NOT NULL,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`)

  await queryFn(`
    CREATE TABLE IF NOT EXISTS \`transaction_group_allowtrades\` (
      \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
      \`transaction_id\` int(10) unsigned NOT NULL,
      \`remote_group_id\` varbinary(64) NOT NULL,
      \`allow\` tinyint(4) NOT NULL DEFAULT '0',
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`)

  await queryFn(`
    CREATE TABLE IF NOT EXISTS \`transaction_group_creates\` (
      \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
      \`transaction_id\` int(10) unsigned NOT NULL,
      \`group_public_key\` binary(32) NOT NULL,
      \`group_id\` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
      \`name\` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`)

  await queryFn(`
    CREATE TABLE IF NOT EXISTS \`transaction_send_coins\` (
      \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
      \`transaction_id\` int(10) unsigned NOT NULL,
      \`sender_public_key\` binary(32) NOT NULL,
      \`state_user_id\` int(10) unsigned DEFAULT 0,
      \`receiver_public_key\` binary(32) NOT NULL,
      \`receiver_user_id\` int(10) unsigned DEFAULT 0,
      \`amount\` bigint(20) NOT NULL,
      \`sender_final_balance\` bigint(20) NOT NULL,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`)

  await queryFn(`
    CREATE TABLE IF NOT EXISTS \`transaction_signatures\` (
      \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
      \`transaction_id\` int(10) unsigned NOT NULL,
      \`signature\` binary(64) NOT NULL,
      \`pubkey\` binary(32) NOT NULL,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`)

  await queryFn(`
    CREATE TABLE IF NOT EXISTS \`transaction_types\` (
      \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
      \`name\` varchar(90) COLLATE utf8mb4_unicode_ci NOT NULL,
      \`text\` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`)
  await queryFn(`
    INSERT IGNORE INTO \`transaction_types\` (\`id\`, \`name\`, \`text\`) VALUES
      (1, 'creation', 'create new gradidos for member and also for group (in development)'),
      (2, 'transfer', 'send gradidos from one member to another, also cross group transfer'),
      (3, 'group create', 'create a new group, trigger creation of new hedera topic and new blockchain on node server'),
      (4, 'group add member', 'add user to a group or move if he was already in a group'),
      (5, 'group remove member', 'remove user from group, maybe he was moved elsewhere'),
      (6, 'hedera topic create', 'create new topic on hedera'),
      (7, 'hedera topic send message', 'send consensus message over hedera topic'),
      (8, 'hedera account create', 'create new account on hedera for holding some founds with unencrypted keys'),
      (9, 'decay start', 'signalize the starting point for decay calculation, allowed only once per chain');`)

  await queryFn(`
    CREATE TABLE IF NOT EXISTS \`transactions\` (
      \`id\` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
      \`state_group_id\` int(10) unsigned DEFAULT NULL,
      \`transaction_type_id\` int(10) unsigned NOT NULL,
      \`tx_hash\` binary(48) DEFAULT NULL,
      \`memo\` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
      \`received\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`blockchain_type_id\` bigint(20) unsigned NOT NULL DEFAULT 1,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`)
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // write downgrade logic as parameter of queryFn
  await queryFn(`DROP TABLE IF EXISTS \`address_types\`;`)
  await queryFn(`DROP TABLE IF EXISTS \`admin_errors\`;`)
  await queryFn(`DROP TABLE IF EXISTS \`blockchain_types\`;`)
  await queryFn(`DROP TABLE IF EXISTS \`community_profiles\`;`)
  await queryFn(`DROP TABLE IF EXISTS \`operator_types\`;`)
  await queryFn(`DROP TABLE IF EXISTS \`operators\`;`)
  await queryFn(`DROP TABLE IF EXISTS \`pending_transactions\`;`)
  await queryFn(`DROP TABLE IF EXISTS \`roles\`;`)
  await queryFn(`DROP TABLE IF EXISTS \`server_users\`;`)
  await queryFn(`DROP TABLE IF EXISTS \`state_balances\`;`)
  await queryFn(`DROP TABLE IF EXISTS \`state_created\`;`)
  await queryFn(`DROP TABLE IF EXISTS \`state_errors\`;`)
  await queryFn(`DROP TABLE IF EXISTS \`state_group_addresses\`;`)
  await queryFn(`DROP TABLE IF EXISTS \`state_group_relationships\`;`)
  await queryFn(`DROP TABLE IF EXISTS \`state_groups\`;`)
  await queryFn(`DROP TABLE IF EXISTS \`state_relationship_types\`;`)
  await queryFn(`DROP TABLE IF EXISTS \`state_user_roles\`;`)
  await queryFn(`DROP TABLE IF EXISTS \`state_user_transactions\`;`)
  await queryFn(`DROP TABLE IF EXISTS \`state_users\`;`)
  await queryFn(`DROP TABLE IF EXISTS \`transaction_creations\`;`)
  await queryFn(`DROP TABLE IF EXISTS \`transaction_group_addaddress\`;`)
  await queryFn(`DROP TABLE IF EXISTS \`transaction_group_allowtrades\`;`)
  await queryFn(`DROP TABLE IF EXISTS \`transaction_group_creates\`;`)
  await queryFn(`DROP TABLE IF EXISTS \`transaction_send_coins\`;`)
  await queryFn(`DROP TABLE IF EXISTS \`transaction_signatures\`;`)
  await queryFn(`DROP TABLE IF EXISTS \`transaction_types\`;`)
  await queryFn(`DROP TABLE IF EXISTS \`transactions\`;`)
}
