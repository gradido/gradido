/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // write upgrade logic as parameter of queryFn
  await queryFn(
    `ALTER TABLE \`transaction_recipes\` ADD COLUMN \`backend_transaction_id\` bigint(20) unsigned DEFAULT NULL AFTER \`iota_message_id\`;`,
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
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`ALTER TABLE \`transaction_recipes\` DROP COLUMN \`backend_transaction_id\`;`)
  await queryFn(
    `ALTER TABLE \`transaction_recipes\` MODIFY COLUMN \`protocol_version\` int(10) NOT NULL DEFAULT 1;`,
  )
  await queryFn(
    `ALTER TABLE \`transaction_recipes\` MODIFY COLUMN \`sender_community_id\` int(10) unsigned NOT NULL;`,
  )
  await queryFn(
    `ALTER TABLE \`transaction_recipes\` MODIFY COLUMN \`signing_account_id\` int(10) unsigned NOT NULL;`,
  )
}
