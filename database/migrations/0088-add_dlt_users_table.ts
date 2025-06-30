/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`
    CREATE TABLE \`dlt_users\` (
      \`id\` int unsigned NOT NULL AUTO_INCREMENT,
      \`user_id\` int(10) unsigned NOT NULL,
      \`message_id\` varchar(64) NULL DEFAULT NULL,
      \`verified\` tinyint(4) NOT NULL DEFAULT 0,
      \`created_at\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      \`verified_at\` datetime(3),
      \`error\` text NULL DEFAULT NULL,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`)

  await queryFn(
    'ALTER TABLE `dlt_transactions` RENAME COLUMN `transactions_id` TO `transaction_id`;',
  )
  await queryFn('ALTER TABLE `dlt_transactions` ADD COLUMN `error` text NULL DEFAULT NULL;')
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`DROP TABLE \`dlt_users\`;`)

  await queryFn(
    'ALTER TABLE `dlt_transactions` RENAME COLUMN `transaction_id` TO `transactions_id`;',
  )
  await queryFn('ALTER TABLE `dlt_transactions` DROP COLUMN `error`;')
}
