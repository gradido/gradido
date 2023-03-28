/* MIGRATION TO ADD LINK ID FIELDS TO EVENT TABLE
 *
 * This migration add two fields to store a TransactionLinkId and a ContributionLinkId
 * in the event table. Furthermore the event `REDEEM_REGISTER` is rewritten to use the
 * new fields.
 */

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    'ALTER TABLE `events` ADD COLUMN `involved_transaction_link_id` int(10) unsigned DEFAULT NULL AFTER `involved_contribution_message_id`;',
  )
  await queryFn(
    'ALTER TABLE `events` ADD COLUMN `involved_contribution_link_id` int(10) unsigned DEFAULT NULL AFTER `involved_transaction_link_id`;',
  )
  await queryFn(
    'UPDATE `events` SET `involved_transaction_link_id` = `involved_transaction_id`, `involved_transaction_id` = NULL, `involved_contribution_link_id` = `involved_contribution_id`, `involved_contribution_id` = NULL WHERE `type` = "REDEEM_REGISTER";',
  )
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    'UPDATE `events` SET `involved_transaction_id` = `involved_transaction_link_id`, `involved_contribution_id` = `involved_contribution_link_id` WHERE `type` = "REDEEM_REGISTER";',
  )
  await queryFn('ALTER TABLE `events` DROP COLUMN `involved_contribution_link_id`;')
  await queryFn('ALTER TABLE `events` DROP COLUMN `involved_transaction_link_id`;')
}
