/* MIGRATION TO ADD denied_by, denied_at, contribution_type and contrinution_status 
FIELDS TO contributions */

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    'ALTER TABLE `contributions` ADD COLUMN `denied_at` datetime DEFAULT NULL AFTER `confirmed_at`;',
  )
  await queryFn(
    'ALTER TABLE `contributions` ADD COLUMN `denied_by` int(10) unsigned DEFAULT NULL AFTER `denied_at`;',
  )
  await queryFn(
    'ALTER TABLE `contributions` ADD COLUMN `contribution_type` varchar(12) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT "ADMIN"  AFTER `denied_by`;',
  )
  await queryFn(
    'ALTER TABLE `contributions` ADD COLUMN `contribution_status` varchar(12) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT "PENDING" AFTER `contribution_type`;',
  )
  await queryFn(
    'UPDATE `contributions` SET `contribution_type` = "LINK" WHERE `contribution_link_id` IS NOT NULL;',
  )
  await queryFn(
    'UPDATE `contributions` SET `contribution_type` = "USER" WHERE `contribution_link_id` IS NULL AND `moderator_id` IS NULL;',
  )
  await queryFn(
    'UPDATE `contributions` SET `contribution_status` = "CONFIRMED" WHERE `confirmed_at` IS NOT NULL;',
  )
  await queryFn(
    'UPDATE `contributions` SET `contribution_status` = "DELETED" WHERE `deleted_at` IS NOT NULL;',
  )
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('ALTER TABLE `contributions` DROP COLUMN `contribution_status`;')
  await queryFn('ALTER TABLE `contributions` DROP COLUMN `contribution_type`;')
  await queryFn('ALTER TABLE `contributions` DROP COLUMN `denied_by`;')
  await queryFn('ALTER TABLE `contributions` DROP COLUMN `denied_at`;')
}
