/* MIGRATION TO ADD PRIVATE KEY IN COMMUNITY TABLE
 *
 * This migration adds a field for the private key in the community.table
 */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    'ALTER TABLE `communities` ADD COLUMN `private_key` binary(64) DEFAULT NULL AFTER `public_key`;',
  )
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('ALTER TABLE `communities` DROP COLUMN `private_key`;')
}
