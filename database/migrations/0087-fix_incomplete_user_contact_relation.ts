/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    'ALTER TABLE `user_contacts` ADD `is_primary` BOOLEAN NOT NULL DEFAULT TRUE AFTER `type`;',
  )
  await queryFn('ALTER TABLE `users` DROP `email_id`;')
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('ALTER TABLE `user_contacts` DROP `is_primary`;')
  await queryFn('ALTER TABLE `users` ADD COLUMN `email_id` int(10) NULL AFTER `email`;')
  // set in users table the email_id of the primary contact for this user
  await queryFn(
    'UPDATE users AS u JOIN user_contacts AS c ON u.id = c.user_id SET u.email_id = c.id WHERE c.is_primary = true;',
  )
}
