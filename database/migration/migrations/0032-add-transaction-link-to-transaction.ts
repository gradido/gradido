/* MIGRATION TO ADD transactionLinkId FIELDTO TRANSACTION */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    'ALTER TABLE `transactions` ADD COLUMN `transaction_link_id` int UNSIGNED DEFAULT NULL AFTER `linked_transaction_id`;',
  )
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('ALTER TABLE `transactions` DROP COLUMN `transaction_link_id`;')
}
