/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // write upgrade logic as parameter of queryFn
  await queryFn(`DROP TABLE \`confirmed_transactions\`;`)
  await queryFn(`DROP TABLE \`transaction_recipes\`;`)

  await queryFn(`
    ALTER TABLE \`accounts\` 
      RENAME COLUMN \`balance\` TO \`balance_confirmed_at\`,
      RENAME COLUMN \`balance_date\` TO \`balance_confirmed_at_date\`,
  `)

  await queryFn(
    `ALTER TABLE \`accounts\` MODIFY COLUMN  \`derivation_index\` int(10) unsigned NULL DEFAULT NULL;`,
  )
  await queryFn(
    `ALTER TABLE \`accounts\` ADD COLUMN \`balance_created_at\` decimal(40,20) NOT NULL DEFAULT 0 AFTER \`balance_date\`;`,
  )
  await queryFn(
    `ALTER TABLE \`accounts\` ADD COLUMN \`balance_created_at_date\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) AFTER \`balance_created_at\`;`,
  )

  await queryFn(
    `CREATE TABLE \`transactions\` (
        \`id\` bigint unsigned NOT NULL AUTO_INCREMENT,
        \`iota_message_id\` varbinary(32) NULL DEFAULT NULL,
        \`backend_transaction_id\` bigint unsigned NULL DEFAULT NULL,
        \`paring_transaction_id\` bigint unsigned NULL DEFAULT NULL,
        \`signing_account_id\` int unsigned NULL DEFAULT NULL,
        \`recipient_account_id\` int unsigned NULL DEFAULT NULL,
        \`sender_community_id\` int unsigned NOT NULL,
        \`recipient_community_id\` int unsigned NULL DEFAULT NULL,
        \`amount\` decimal(40, 20) NULL DEFAULT NULL,
        \`account_balance_created_at\` decimal(40, 20) NOT NULL,
        \`type\` tinyint NOT NULL,
        \`created_at\` datetime(3) NOT NULL,
        \`body_bytes\` blob NOT NULL,
        \`signature\` varbinary(64) NOT NULL,
        \`protocol_version\` varchar(255) NOT NULL DEFAULT '1',
        \`nr\` bigint NULL DEFAULT NULL,
        \`running_hash\` varbinary(48) NULL DEFAULT NULL,
        \`account_balance\` decimal(40, 20) NULL DEFAULT 0.00000000000000000000,
        \`iota_milestone\` bigint  NULL DEFAULT NULL,
        \`confirmed_at\` datetime NULL DEFAULT NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`signature\` (\`signature\`),
        FOREIGN KEY (\`signing_account_id\`) REFERENCES accounts(id),
        FOREIGN KEY (\`recipient_account_id\`) REFERENCES accounts(id),
        FOREIGN KEY (\`sender_community_id\`) REFERENCES communities(id),
        FOREIGN KEY (\`recipient_community_id\`) REFERENCES communities(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `,
  )

  await queryFn(`ALTER TABLE \`communities\` ADD UNIQUE(\`iota_topic\`);`)
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
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
      \`created_at\` datetime(3) NOT NULL,
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

  await queryFn(`
    ALTER TABLE \`accounts\` 
      RENAME COLUMN \`balance_confirmed_at\` TO \`balance\`,
      RENAME COLUMN \`balance_confirmed_at_date\` TO \`balance_date\`,
  `)

  await queryFn(
    `ALTER TABLE \`accounts\` MODIFY COLUMN  \`derivation_index\` int(10) unsigned NOT NULL;`,
  )
  await queryFn(`ALTER TABLE \`accounts\` DROP COLUMN \`balance_created_at\`;`)
  await queryFn(`ALTER TABLE \`accounts\` DROP COLUMN \`balance_created_at_date\`;`)
  await queryFn(`DROP TABLE \`transactions\`;`)
}
