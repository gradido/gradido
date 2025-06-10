/* MIGRATION TO CORRECT THE PUBLIC KEY LENGTHS
 *
 * This migration corrects the length of the saved public keys to 32 as this is the length it is generated for.
 */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // federated communities
  await queryFn('DROP INDEX `public_api_key` ON `federated_communities`;')
  await queryFn('UPDATE `federated_communities` SET `public_key` = UNHEX(public_key);')
  await queryFn(
    'ALTER TABLE `federated_communities` ADD COLUMN `public_key_new` binary(32) NOT NULL AFTER `public_key`;',
  )
  await queryFn('UPDATE `federated_communities` SET public_key_new = substring(public_key,1,32);')
  await queryFn('ALTER TABLE `federated_communities` DROP COLUMN public_key;')
  await queryFn('ALTER TABLE `federated_communities` RENAME COLUMN public_key_new TO public_key;')
  await queryFn(
    'ALTER TABLE `federated_communities` ADD CONSTRAINT `public_api_key` UNIQUE (public_key, api_version);',
  )

  // communities
  await queryFn(
    'ALTER TABLE `communities` ADD COLUMN `public_key_new` binary(32) NOT NULL AFTER `public_key`;',
  )
  await queryFn('UPDATE `communities` SET public_key_new = substring(public_key,1,32);')
  await queryFn('ALTER TABLE `communities` DROP COLUMN public_key;')
  await queryFn('ALTER TABLE `communities` RENAME COLUMN public_key_new TO public_key;')
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    'ALTER TABLE `federated_communities` MODIFY COLUMN `public_key` binary(64) NOT NULL;',
  )
  await queryFn(
    'UPDATE `federated_communities` SET `public_key` = substring(HEX(public_key),1,64);',
  )
  await queryFn(
    'ALTER TABLE `communities` MODIFY COLUMN `public_key` binary(64) NULL DEFAULT NULL;',
  )
}
