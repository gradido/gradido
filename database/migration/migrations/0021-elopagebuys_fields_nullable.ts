/* MIGRATION TO ALLOW NULL FIELDS ON ELOPAGEBUYS
 *
 * This migration allows null on `affiliate_program_id`,
 * `publisher_id`, `order_id`. `product_id`.
 */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    'ALTER TABLE `login_elopage_buys` MODIFY COLUMN `affiliate_program_id` int(11) DEFAULT NULL;',
  )
  await queryFn(
    'ALTER TABLE `login_elopage_buys` MODIFY COLUMN `publisher_id` int(11) DEFAULT NULL;',
  )
  await queryFn('ALTER TABLE `login_elopage_buys` MODIFY COLUMN `order_id` int(11) DEFAULT NULL;')
  await queryFn('ALTER TABLE `login_elopage_buys` MODIFY COLUMN `product_id` int(11) DEFAULT NULL;')
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    'ALTER TABLE `login_elopage_buys` MODIFY COLUMN `affiliate_program_id` int(11) NOT NULL;',
  )
  await queryFn('ALTER TABLE `login_elopage_buys` MODIFY COLUMN `publisher_id` int(11) NOT NULL;')
  await queryFn('ALTER TABLE `login_elopage_buys` MODIFY COLUMN `order_id` int(11) NOT NULL;')
  await queryFn('ALTER TABLE `login_elopage_buys` MODIFY COLUMN `product_id` int(11) NOT NULL;')
}
