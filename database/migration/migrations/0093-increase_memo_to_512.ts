/* MIGRATION TO INCREASE memo TO 512 in all tables which have a memo field
 *
 * This migration increases the memo field in all tables which have a memo field to 512
 */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('ALTER TABLE `contributions` MODIFY COLUMN `memo` varchar(512) NOT NULL;')
  await queryFn('ALTER TABLE `contribution_links` MODIFY COLUMN `memo` varchar(512) NOT NULL;')
  await queryFn('ALTER TABLE `pending_transactions` MODIFY COLUMN `memo` varchar(512) NOT NULL;')
  await queryFn('ALTER TABLE `transactions` MODIFY COLUMN `memo` varchar(512) NOT NULL;')
  await queryFn('ALTER TABLE `transaction_links` MODIFY COLUMN `memo` varchar(512) NOT NULL;')
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('ALTER TABLE `contributions` MODIFY COLUMN `memo` varchar(255) NOT NULL;')
  await queryFn('ALTER TABLE `contribution_links` MODIFY COLUMN `memo` varchar(255) NOT NULL;')
  await queryFn('ALTER TABLE `pending_transactions` MODIFY COLUMN `memo` varchar(255) NOT NULL;')
  await queryFn('ALTER TABLE `transactions` MODIFY COLUMN `memo` varchar(255) NOT NULL;')
  await queryFn('ALTER TABLE `transaction_links` MODIFY COLUMN `memo` varchar(255) NOT NULL;')
}
