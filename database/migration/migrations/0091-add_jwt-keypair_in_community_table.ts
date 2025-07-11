/* MIGRATION TO ADD JWT-KEYPAIR IN COMMUNITY TABLE
 *
 * This migration adds fields for the jwt-keypair in the community.table
 */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    'ALTER TABLE `communities` ADD COLUMN `public_jwt_key` varchar(512) DEFAULT NULL AFTER `gms_api_key`;',
  )
  await queryFn(
    'ALTER TABLE `communities` ADD COLUMN `private_jwt_key` varchar(2048) DEFAULT NULL AFTER `public_jwt_key`;',
  )
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('ALTER TABLE `communities` DROP COLUMN `public_jwt_key`;')
  await queryFn('ALTER TABLE `communities` DROP COLUMN `private_jwt_key`;')
}
