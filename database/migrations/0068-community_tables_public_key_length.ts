/* MIGRATION TO CORRECT THE PUBLIC KEY LENGTHS
 *
 * This migration corrects the length of the saved public keys to 32 as this is the length it is generated for.
 */

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('UPDATE `communities` SET `public_key` = UNHEX(public_key);')
  await queryFn('ALTER TABLE `communities` MODIFY COLUMN `public_key` binary(32) NOT NULL;')
  await queryFn(
    'ALTER TABLE `federated_communities` MODIFY COLUMN `public_key` binary(32) NULL DEFAULT NULL;',
  )
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('ALTER TABLE `communities` MODIFY COLUMN `public_key` binary(64) NOT NULL;')
  await queryFn('UPDATE `communities` SET `public_key` = HEX(public_key);')
  await queryFn(
    'ALTER TABLE `federated_communities` MODIFY COLUMN `public_key` binary(64) NULL DEFAULT NULL;',
  )
}
