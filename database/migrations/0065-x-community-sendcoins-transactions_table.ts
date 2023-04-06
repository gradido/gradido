/* MIGRATION TO add users that have a transaction but do not exist */

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    'ALTER TABLE `transactions` MODIFY COLUMN `previous` int(10) unsigned DEFAULT NULL NULL AFTER `id`;',
  )
  await queryFn(
    'ALTER TABLE `transactions` MODIFY COLUMN `type_id` int(10) DEFAULT NULL NULL AFTER `previous`;',
  )
  await queryFn(
    'ALTER TABLE `transactions` MODIFY COLUMN `transaction_link_id` int(10) unsigned DEFAULT NULL NULL AFTER `type_id`;',
  )
  await queryFn(
    'ALTER TABLE `transactions` MODIFY COLUMN `amount` decimal(40,20) DEFAULT NULL NULL AFTER `transaction_link_id`;',
  )
  await queryFn(
    'ALTER TABLE `transactions` MODIFY COLUMN `balance` decimal(40,20) DEFAULT NULL NULL AFTER `amount`;',
  )
  await queryFn(
    'ALTER TABLE `transactions` MODIFY COLUMN `balance_date` datetime(3) DEFAULT current_timestamp(3) NOT NULL AFTER `balance`;',
  )
  await queryFn(
    'ALTER TABLE `transactions` MODIFY COLUMN `decay` decimal(40,20) DEFAULT NULL NULL AFTER `balance_date`;',
  )
  await queryFn(
    'ALTER TABLE `transactions` MODIFY COLUMN `decay_start` datetime(3) DEFAULT NULL NULL AFTER `decay`;',
  )
  await queryFn(
    'ALTER TABLE `transactions` MODIFY COLUMN `memo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL AFTER `decay_start`;',
  )
  await queryFn(
    'ALTER TABLE `transactions` MODIFY COLUMN `creation_date` datetime(3) DEFAULT NULL NULL AFTER `memo`;',
  )
  await queryFn(
    'ALTER TABLE `transactions` MODIFY COLUMN `user_id` int(10) unsigned NOT NULL AFTER `creation_date`;',
  )
  await queryFn(
    'ALTER TABLE `transactions` ADD COLUMN `user_gradido_id` char(36) DEFAULT NULL NULL AFTER `user_id`;',
  )
  await queryFn(
    'ALTER TABLE `transactions` ADD COLUMN `user_community_uuid` char(36) DEFAULT NULL NULL AFTER `user_gradido_id`;',
  )
  await queryFn(
    'ALTER TABLE `transactions` ADD COLUMN `user_name` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL NULL AFTER `user_community_uuid`;',
  )
  await queryFn(
    'ALTER TABLE `transactions` MODIFY COLUMN `linked_user_id` int(10) unsigned DEFAULT NULL NULL AFTER `user_name`;',
  )
  await queryFn(
    'ALTER TABLE `transactions` ADD COLUMN `linked_user_gradido_id` char(36) DEFAULT NULL NULL AFTER `linked_user_id`;',
  )
  await queryFn(
    'ALTER TABLE `transactions` ADD COLUMN `linked_user_community_uuid` char(36) DEFAULT NULL NULL AFTER `linked_user_gradido_id`;',
  )
  await queryFn(
    'ALTER TABLE `transactions` ADD COLUMN `linked_user_name` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL NULL AFTER `linked_user_community_uuid`;',
  )
  await queryFn(
    'ALTER TABLE `transactions` MODIFY COLUMN `linked_transaction_id` int(10) DEFAULT NULL NULL AFTER `linked_user_name`;',
  )

  await queryFn(
    `UPDATE transactions t, users u SET t.user_gradido_id = u.gradido_id, t.user_name = concat(u.first_name, ' ', u.last_name) WHERE t.user_id = u.id and t.user_gradido_id is null;`,
  )
  await queryFn(
    'ALTER TABLE `transactions` MODIFY COLUMN `user_gradido_id` char(36) NOT NULL AFTER `user_id`;',
  )
  /*
  await queryFn(
    'ALTER TABLE `transactions` MODIFY COLUMN `user_name` varchar(512) COLLATE utf8mb4_unicode_ci NOT NULL AFTER `user_community_uuid`;',
  )
  */
  await queryFn(
    `UPDATE transactions t, users u SET t.linked_user_gradido_id = u.gradido_id, t.linked_user_name = concat(u.first_name, ' ', u.last_name) WHERE t.linked_user_id = u.id and t.linked_user_id is null and t.linked_user_gradido_id is null;`,
  )

  await queryFn(`
      CREATE TABLE IF NOT EXISTS \`pending_transactions\` (
        \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
        \`previous\` int(10) unsigned DEFAULT NULL NULL,
        \`type_id\` int(10) DEFAULT NULL NULL,
        \`transaction_link_id\` int(10) unsigned DEFAULT NULL NULL,
        \`amount\` decimal(40,20) DEFAULT NULL NULL,
        \`balance\` decimal(40,20) DEFAULT NULL NULL,
        \`balance_date\` datetime(3) DEFAULT current_timestamp(3) NOT NULL,
        \`decay\` decimal(40,20) DEFAULT NULL NULL,
        \`decay_start\` datetime(3) DEFAULT NULL NULL,
        \`memo\` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
        \`creation_date\` datetime(3) DEFAULT NULL NULL,
        \`user_id\` int(10) unsigned NOT NULL,
        \`user_gradido_id\` char(36) NOT NULL,
        \`user_community_uuid\` char(36) NOT NULL,
        \`user_name\` varchar(512) COLLATE utf8mb4_unicode_ci NOT NULL,
        \`linked_user_id\` int(10) unsigned DEFAULT NULL NULL,
        \`linked_user_gradido_id\` char(36) NOT NULL,
        \`linked_user_community_uuid\` char(36) NOT NULL,
        \`linked_user_name\` varchar(512) NULL,
        \`linked_transaction_id\` int(10) DEFAULT NULL NULL,
        \`x_transaction_state\` varchar(100) NOT NULL COMMENT 'States to handle 2-Phase-Commit handshake',
        \`created_at\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updated_at\` datetime(3) NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP(3),
        \`deleted_at\` datetime(3) NULL DEFAULT NULL,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`)

}

/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('ALTER TABLE `transactions` DROP COLUMN `user_gradido_id`;')
  await queryFn('ALTER TABLE `transactions` DROP COLUMN `user_community_uuid`;')
  await queryFn('ALTER TABLE `transactions` DROP COLUMN `user_name`;')
  await queryFn('ALTER TABLE `transactions` DROP COLUMN `linked_user_gradido_id`;')
  await queryFn('ALTER TABLE `transactions` DROP COLUMN `linked_user_community_uuid`;')
  await queryFn('ALTER TABLE `transactions` DROP COLUMN `linked_user_name`;')
  await queryFn(`DROP TABLE IF EXISTS pending_transactions;`)
}
