/* MIGRATION TO ADD contribution_link_id FIELD TO users */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    'ALTER TABLE `users` ADD COLUMN `contribution_link_id` int UNSIGNED DEFAULT NULL AFTER `referrer_id`;',
  )
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('ALTER TABLE `users` DROP COLUMN `contribution_link_id`;')
}
