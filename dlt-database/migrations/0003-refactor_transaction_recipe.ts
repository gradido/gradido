/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // write upgrade logic as parameter of queryFn
  await queryFn(
    `ALTER TABLE \`transaction_recipes\` ADD COLUMN \`backend_transaction_id\` bigint(20) unsigned NULL DEFAULT NULL AFTER \`iota_message_id\`;`,
  )
  await queryFn(
    `ALTER TABLE \`transaction_recipes\` ADD COLUMN \`paring_transaction_recipe_id\` bigint(20) unsigned NULL DEFAULT NULL AFTER \`backend_transaction_id\`;`,
  )
  await queryFn(
    `ALTER TABLE \`transaction_recipes\` MODIFY COLUMN \`protocol_version\` varchar(255) NOT NULL DEFAULT '1';`,
  )
  await queryFn(
    `ALTER TABLE \`transaction_recipes\` MODIFY COLUMN \`sender_community_id\` int(10) unsigned NULL DEFAULT NULL;`,
  )
  await queryFn(
    `ALTER TABLE \`transaction_recipes\` MODIFY COLUMN \`signing_account_id\` int(10) unsigned NULL DEFAULT NULL;`,
  )
  await queryFn(`ALTER TABLE \`transaction_recipes\` ADD UNIQUE KEY \`signature\` (\`signature\`);`)

  await queryFn(
    `ALTER TABLE \`transaction_recipes\` ADD COLUMN \`account_balance_created_at\` decimal(40,20) NOT NULL DEFAULT 0 AFTER \`amount\`;`,
  )

  await queryFn(
    `ALTER TABLE \`confirmed_transactions\` MODIFY COLUMN  \`account_id\` int(10) unsigned NULL DEFAULT NULL;`,
  )
  await queryFn(
    `ALTER TABLE \`confirmed_transactions\` MODIFY COLUMN  \`iota_milestone\` bigint NULL DEFAULT NULL;`,
  )

  await queryFn(
    `ALTER TABLE \`accounts\` MODIFY COLUMN  \`derivation_index\` int(10) unsigned NULL DEFAULT NULL;`,
  )
  await queryFn(
    `ALTER TABLE \`accounts\` ADD COLUMN \`account_balance_created_at\` decimal(40,20) NOT NULL DEFAULT 0 AFTER \`balance_date\`;`,
  )
  await queryFn(
    `ALTER TABLE \`accounts\` ADD COLUMN \`balance_created_at_date\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) AFTER \`account_balance_created_at\`;`,
  )

  await queryFn(
    `CREATE TABLE \`transactions\` (
        \`id\` bigint unsigned NOT NULL AUTO_INCREMENT,
        \`iota_message_id\` varbinary(32) DEFAULT NULL,
        \`backend_transaction_id\` bigint unsigned DEFAULT NULL,
        \`paring_transaction_id\` bigint unsigned DEFAULT NULL,
        \`signing_account_id\` int unsigned DEFAULT NULL,
        \`recipient_account_id\` int unsigned DEFAULT NULL,
        \`sender_community_id\` int unsigned NOT NULL,
        \`recipient_community_id\` int unsigned DEFAULT NULL,
        \`amount\` decimal(40, 20) DEFAULT NULL,
        \`account_balance_created_at\` decimal(40, 20) NOT NULL,
        \`type\` tinyint NOT NULL,
        \`created_at\` datetime(3) NOT NULL,
        \`body_bytes\` blob NOT NULL,
        \`signature\` varbinary(64) NOT NULL,
        \`protocol_version\` varchar(255) NOT NULL DEFAULT '1',
        \`nr\` bigint NOT NULL,
        \`running_hash\` varbinary(48) NOT NULL,
        \`account_balance\` decimal(40, 20) NOT NULL DEFAULT 0.00000000000000000000,
        \`iota_milestone\` bigint DEFAULT NULL,
        \`confirmed_at\` datetime NOT NULL,
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
  await queryFn(`ALTER TABLE \`transaction_recipes\` DROP COLUMN \`backend_transaction_id\`;`)
  await queryFn(`ALTER TABLE \`transaction_recipes\` DROP COLUMN \`paring_transaction_recipe_id\`;`)
  await queryFn(
    `ALTER TABLE \`transaction_recipes\` MODIFY COLUMN \`protocol_version\` int(10) NOT NULL DEFAULT 1;`,
  )
  await queryFn(
    `ALTER TABLE \`transaction_recipes\` MODIFY COLUMN \`sender_community_id\` int(10) unsigned NOT NULL;`,
  )
  await queryFn(
    `ALTER TABLE \`transaction_recipes\` MODIFY COLUMN \`signing_account_id\` int(10) unsigned NOT NULL;`,
  )
  await queryFn(`ALTER TABLE \`transaction_recipes\` DROP INDEX \`signature\`;`)
  await queryFn(`ALTER TABLE \`transaction_recipes\` DROP COLUMN \`account_balance_created_at\`;`)
  await queryFn(
    `ALTER TABLE \`confirmed_transactions\` MODIFY COLUMN  \`account_id\` int(10) unsigned NOT NULL;`,
  )
  await queryFn(
    `ALTER TABLE \`confirmed_transactions\` MODIFY COLUMN  \`iota_milestone\` bigint NOT NULL;`,
  )
  await queryFn(
    `ALTER TABLE \`accounts\` MODIFY COLUMN  \`derivation_index\` int(10) unsigned NOT NULL;`,
  )
  await queryFn(`ALTER TABLE \`accounts\` DROP COLUMN \`account_balance_created_at\`;`)
  await queryFn(`ALTER TABLE \`accounts\` DROP COLUMN \`balance_created_at_date\`;`)
  await queryFn(`DROP TABLE \`transactions\`;`)
}
