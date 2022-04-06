/* MIGRATION TO CHANGE `amount` FIELD TYPE TO `Decimal` ON `admin_pending_creations` */

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // rename `amount` to `amount_bigint`
  await queryFn('ALTER TABLE `admin_pending_creations` RENAME COLUMN `amount` TO `amount_bigint`;')
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
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    'ALTER TABLE `admin_pending_creations` ADD COLUMN `amount_bigint` bigint(20) DEFAULT NULL AFTER `amount`;',
  )
  await queryFn('UPDATE `admin_pending_creations` SET `amount_bigint` = `amount` * 10000;')
  await queryFn(
    'ALTER TABLE `admin_pending_creations` MODIFY COLUMN `amount_bigint` bigint(20) NOT NULL;',
  )
  await queryFn('ALTER TABLE `admin_pending_creations` DROP COLUMN `amount`;')
  await queryFn('ALTER TABLE `admin_pending_creations` RENAME COLUMN `amount_bigint` TO `amount`;')
}
