/* MIGRATION TO ADD GRADIDO_ID
 *
 * This migration adds new columns to the table `users` and creates the
 * new table `user_contacts`
 */

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // define datetime column with a precision of 3 milliseconds
  await queryFn(
    'ALTER TABLE `contributions` MODIFY COLUMN `created_at` datetime(3) NULL DEFAULT NULL AFTER `user_id`;',
  )
  await queryFn(
    'ALTER TABLE `contributions` MODIFY COLUMN `contribution_date` datetime(3) NULL DEFAULT NULL AFTER `created_at`;',
  )
  await queryFn(
    'ALTER TABLE `contributions` MODIFY COLUMN `confirmed_at` datetime(3) NULL DEFAULT NULL AFTER `confirmed_by`;',
  )
  await queryFn(
    'ALTER TABLE `contributions` MODIFY COLUMN `denied_at` datetime(3) NULL DEFAULT NULL AFTER `denied_by`;',
  )
  await queryFn(
    'ALTER TABLE `contributions` MODIFY COLUMN `deleted_at` datetime(3) NULL DEFAULT NULL AFTER `contribution_status`;',
  )


  await queryFn(
    'ALTER TABLE `transactions` MODIFY COLUMN `balance_date` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) AFTER `balance`;',
  )
  await queryFn(
    'ALTER TABLE `transactions` MODIFY COLUMN `decay_start` datetime(3) NULL DEFAULT NULL AFTER `decay`;',
  )
  await queryFn(
    'ALTER TABLE `transactions` MODIFY COLUMN `creation_date` datetime(3) NULL DEFAULT NULL AFTER `memo`;',
  )

  /**
  // define datetime column with a precision of 3 milliseconds
  await queryFn(
    'ALTER TABLE `users` MODIFY COLUMN `created` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) AFTER `email_hash`;',
  )
  // define datetime column with a precision of 3 milliseconds
  await queryFn(
    'ALTER TABLE `users` MODIFY COLUMN `deletedAt` datetime(3) NULL DEFAULT NULL AFTER `last_name`;',
  )
  // define datetime column with a precision of 3 milliseconds
  await queryFn(
    'ALTER TABLE `users` MODIFY COLUMN `is_admin` datetime(3) NULL DEFAULT NULL AFTER `language`;',
  )

  */
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // ----- contributions table
  await queryFn(
    'ALTER TABLE `contributions` MODIFY COLUMN `created_at` datetime NULL DEFAULT NULL AFTER `user_id`;',
  )
  await queryFn(
    'ALTER TABLE `contributions` MODIFY COLUMN `contribution_date` datetime NULL DEFAULT NULL AFTER `created_at`;',
  )
  await queryFn(
    'ALTER TABLE `contributions` MODIFY COLUMN `confirmed_at` datetime NULL DEFAULT NULL AFTER `confirmed_by`;',
  )
  await queryFn(
    'ALTER TABLE `contributions` MODIFY COLUMN `denied_at` datetime NULL DEFAULT NULL AFTER `denied_by`;',
  )
  await queryFn(
    'ALTER TABLE `contributions` MODIFY COLUMN `deleted_at` datetime NULL DEFAULT NULL AFTER `contribution_status`;',
  )
  // ----- transactions table
  await queryFn(
    'ALTER TABLE `transactions` MODIFY COLUMN `balance_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER `balance`;',
  )
  await queryFn(
    'ALTER TABLE `transactions` MODIFY COLUMN `decay_start` datetime NULL DEFAULT NULL AFTER `decay`;',
  )
  await queryFn(
    'ALTER TABLE `transactions` MODIFY COLUMN `creation_date` datetime NULL DEFAULT NULL AFTER `memo`;',
  )
}
