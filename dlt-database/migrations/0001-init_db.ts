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

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // write upgrade logic as parameter of queryFn
  await queryFn(`
    CREATE TABLE IF NOT EXISTS \`users\` (
      \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
      \`gradido_id\` char(36) DEFAULT NULL,
      \`derive1_pubkey\` binary(32) NOT NULL,
      \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`confirmed_at\` datetime DEFAULT NULL,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`gradido_id\` (\`gradido_id\`),
      UNIQUE KEY \`pubkey\` (\`pubkey\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`)

  await queryFn(`
    CREATE TABLE IF NOT EXISTS \`accounts\` (
      \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
      \`user_id\` int(10) unsigned DEFAULT NULL,
      \`derivation_index\` int(10) unsigned NOT NULL,
      \`derive2_pubkey\` binary(32) NOT NULL,
      \`type\` tinyint unsigned NOT NULL,
      \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`confirmed_at\` datetime DEFAULT NULL,
      \`balance\` decimal(40,20) NOT NULL DEFAULT 0,
      \`balance_date\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, 
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`pubkey\` (\`pubkey\`),
      FOREIGN KEY (\`user_id\`) REFERENCES users(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `)

  await queryFn(`
    CREATE TABLE IF NOT EXISTS \`communities\` (
      \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
      \`iota_topic\` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
      \`root_pubkey\` binary(32) NOT NULL,
      \`root_privkey\` binary(32) DEFAULT NULL,
      \`root_chaincode\` binary(32) DEFAULT NULL,
      \`foreign\` tinyint(4) NOT NULL DEFAULT true,
      \`gmw_account_id\` int(10) unsigned DEFAULT NULL,
      \`auf_account_id\` int(10) unsigned DEFAULT NULL,
      \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`confirmed_at\` datetime DEFAULT NULL,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`pubkey\` (\`pubkey\`),
      FOREIGN KEY (\`gmw_account_id\`) REFERENCES accounts(id),
      FOREIGN KEY (\`auf_account_id\`) REFERENCES accounts(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`)

  await queryFn(`
    CREATE TABLE IF NOT EXISTS \`accounts_communities\` (
      \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
      \`account_id\` int(10) unsigned NOT NULL,
      \`community_id\` int(10) unsigned NOT NULL,
      \`valid_from\` datetime NOT NULL,
      \`valid_to\` datetime DEFAULT NULL,
      PRIMARY KEY (\`id\`),
      FOREIGN KEY (\`account_id\`) REFERENCES accounts(id),
      FOREIGN KEY (\`community_id\`) REFERENCES communities(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`)

  await queryFn(`
    CREATE TABLE IF NOT EXISTS \`transaction_recipes\` (
      \`id\` bigint unsigned NOT NULL AUTO_INCREMENT,
      \`iota_message_id\` binary(32) DEFAULT NULL,
      \`signing_account_id\` int(10) unsigned NOT NULL,
      \`recipient_account_id\` int(10) unsigned DEFAULT NULL,
      \`sender_community_id\` int(10) unsigned NOT NULL,
      \`recipient_community_id\` int(10) unsigned DEFAULT NULL,
      \`amount\` decimal(40,20) DEFAULT NULL,
      \`type\` tinyint unsigned NOT NULL,
      \`created_at\` datetime NOT NULL,
      \`body_bytes\` BLOB NOT NULL,
      \`signature\` binary(64) NOT NULL,
      \`protocol_version\` int(10) NOT NULL DEFAULT 1,
      PRIMARY KEY (\`id\`),
      FOREIGN KEY (\`signing_account_id\`) REFERENCES accounts(id),
      FOREIGN KEY (\`recipient_account_id\`) REFERENCES accounts(id),
      FOREIGN KEY (\`sender_community_id\`) REFERENCES communities(id),
      FOREIGN KEY (\`recipient_community_id\`) REFERENCES communities(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`)

  await queryFn(`
    CREATE TABLE IF NOT EXISTS \`confirmed_transactions\` (
      \`id\` bigint unsigned NOT NULL AUTO_INCREMENT,
      \`transaction_recipe_id\` bigint unsigned NOT NULL,
      \`nr\` bigint unsigned NOT NULL,
      \`running_hash\` binary(48) NOT NULL,
      \`account_id\` int(10) unsigned NOT NULL,
      \`account_balance\` decimal(40,20) NOT NULL DEFAULT 0,
      \`iota_milestone\` bigint NOT NULL,
      \`confirmed_at\` datetime NOT NULL,
      PRIMARY KEY (\`id\`),
      FOREIGN KEY (\`transaction_recipe_id\`) REFERENCES transaction_recipes(id),
      FOREIGN KEY (\`account_id\`) REFERENCES accounts(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`)
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // write downgrade logic as parameter of queryFn
  await queryFn(`DROP TABLE IF EXISTS \`users\`;`)
  await queryFn(`DROP TABLE IF EXISTS \`accounts\`;`)
  await queryFn(`DROP TABLE IF EXISTS \`accounts_communities\`;`)
  await queryFn(`DROP TABLE IF EXISTS \`transaction_recipes\`;`)
  await queryFn(`DROP TABLE IF EXISTS \`confirmed_transactions\`;`)
  await queryFn(`DROP TABLE IF EXISTS \`community\`;`)
}
