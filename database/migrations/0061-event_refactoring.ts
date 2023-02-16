/* MIGRATION TO REFACTOR THE EVENT_PROTOCOL TABLE
 *
 * This migration refactors the `event_protocol` table.
 * It renames the table to `event`, introduces new fields and renames others.
 */

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    'ALTER TABLE `communities` MODIFY COLUMN `last_announced_at` datetime(3) AFTER `end_point`;',
  )
  await queryFn(
    'ALTER TABLE `communities` ADD COLUMN `foreign` tinyint(4) NOT NULL DEFAULT 1 AFTER `id`;',
  )
  await queryFn(
    'ALTER TABLE `communities` ADD COLUMN `verified_at` datetime(3) AFTER `last_announced_at`;',
  )
  await queryFn(
    'ALTER TABLE `communities` ADD COLUMN `last_error_at` datetime(3) AFTER `verified_at`;',
  )
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // write downgrade logic as parameter of queryFn
  await queryFn(
    'ALTER TABLE `communities` MODIFY COLUMN `last_announced_at` datetime(3) NOT NULL AFTER `end_point`;',
  )
  await queryFn('ALTER TABLE `communities` DROP COLUMN `foreign`;')
  await queryFn('ALTER TABLE `communities` DROP COLUMN `verified_at`;')
  await queryFn('ALTER TABLE `communities` DROP COLUMN `last_error_at`;')
}
