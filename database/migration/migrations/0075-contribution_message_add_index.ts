/* MIGRATION TO ADD PRIVATE KEY IN COMMUNITY TABLE
 *
 * This migration adds a field for the private key in the community.table
 */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('ALTER TABLE `contribution_messages` ADD INDEX(`contribution_id`);')
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('ALTER TABLE `contribution_messages` DROP INDEX `contribution_id`')
}
