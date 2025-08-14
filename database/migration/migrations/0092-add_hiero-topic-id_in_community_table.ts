/* MIGRATION TO ADD hiero topic id IN COMMUNITY TABLE
 *
 * This migration adds fields for the hiero topic id in the community.table
 */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    'ALTER TABLE `communities` ADD COLUMN `hiero_topic_id` varchar(512) DEFAULT NULL AFTER `location`;',
  )
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('ALTER TABLE `communities` DROP COLUMN `hiero_topic_id`;')
}
