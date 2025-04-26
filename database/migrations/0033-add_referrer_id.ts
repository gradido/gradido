/* MIGRATION TO ADD referrer_id FIELD TO users */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    'ALTER TABLE `users` ADD COLUMN `referrer_id` int UNSIGNED DEFAULT NULL AFTER `language`;',
  )
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('ALTER TABLE `users` DROP COLUMN `referrer_id`;')
}
