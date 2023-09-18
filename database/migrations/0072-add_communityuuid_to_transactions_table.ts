/* MIGRATION TO add users that have a transaction but do not exist */

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    'ALTER TABLE `transactions` ADD COLUMN `user_community_uuid` char(36) DEFAULT NULL NULL AFTER `user_id`;',
  )
  await queryFn(
    'ALTER TABLE `transactions` ADD COLUMN `linked_user_community_uuid` char(36) DEFAULT NULL NULL AFTER `linked_user_id`;',
  )
  // read the community uuid of the homeCommunity
  const result = await queryFn(`SELECT c.community_uuid from communities as c WHERE c.foreign = 0`)
  // and if uuid exists enter the home_community_uuid for sender and recipient of each still existing transaction
  if (result[0]) {
    await queryFn(
      `UPDATE transactions as t SET t.user_community_uuid = "${result[0].community_uuid}" WHERE t.user_id IS NOT NULL AND t.user_community_uuid IS NULL`,
    )
    await queryFn(
      `UPDATE transactions as t SET t.linked_user_community_uuid = "${result[0].community_uuid}" WHERE t.linked_user_id IS NOT NULL AND t.linked_user_community_uuid IS NULL`,
    )
  }
  await queryFn(
    'ALTER TABLE `transactions` MODIFY COLUMN `user_community_uuid` char(36) NOT NULL AFTER `user_id`;',
  )
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('ALTER TABLE `transactions` DROP COLUMN `user_community_uuid`;')
  await queryFn('ALTER TABLE `transactions` DROP COLUMN `linked_user_community_uuid`;')
}
