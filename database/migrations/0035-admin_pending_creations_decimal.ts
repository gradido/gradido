/* MIGRATION TO CHANGE SEVERAL FIELDS ON `admin_pending_creations`
 * - `amount` FIELD TYPE TO `Decimal`
 * - `memo` FIELD TYPE TO `varchar(255)`, collate `utf8mb4_unicode_ci`
 */

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // rename `amount` to `amount_bigint`
  await queryFn(
    'ALTER TABLE `admin_pending_creations` CHANGE COLUMN `amount` `amount_bigint` bigint(20);',
  )
  // add `amount` (decimal)
  await queryFn(
    'ALTER TABLE `admin_pending_creations` ADD COLUMN `amount` DECIMAL(40,20) DEFAULT NULL AFTER `amount_bigint`;',
  )
  // fill new `amount` column
  await queryFn('UPDATE `admin_pending_creations` SET `amount` = `amount_bigint` DIV 10000;')
  // make `amount` not nullable
  await queryFn(
    'ALTER TABLE `admin_pending_creations` MODIFY COLUMN `amount` DECIMAL(40,20) NOT NULL;',
  )
  // drop `amount_bitint` column
  await queryFn('ALTER TABLE `admin_pending_creations` DROP COLUMN `amount_bigint`;')

  // change `memo` to varchar(255), collate utf8mb4_unicode_ci
  await queryFn(
    'ALTER TABLE `admin_pending_creations` MODIFY COLUMN `memo` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL;',
  )
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('ALTER TABLE `admin_pending_creations` MODIFY COLUMN `memo` text DEFAULT NULL;')
  await queryFn(
    'ALTER TABLE `admin_pending_creations` ADD COLUMN `amount_bigint` bigint(20) DEFAULT NULL AFTER `amount`;',
  )
  await queryFn('UPDATE `admin_pending_creations` SET `amount_bigint` = `amount` * 10000;')
  await queryFn(
    'ALTER TABLE `admin_pending_creations` MODIFY COLUMN `amount_bigint` bigint(20) NOT NULL;',
  )
  await queryFn('ALTER TABLE `admin_pending_creations` DROP COLUMN IF EXISTS `amount`;')
  await queryFn(
    'ALTER TABLE `admin_pending_creations` CHANGE COLUMN `amount_bigint` `amount` bigint(20);',
  )
}
