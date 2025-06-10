export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    'ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `humhub_allowed` tinyint(1) NOT NULL DEFAULT 0 AFTER `gms_registered_at`;',
  )
  await queryFn(
    'ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `humhub_publish_name` int unsigned NOT NULL DEFAULT 0 AFTER `gms_publish_name`;',
  )
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('ALTER TABLE `users` DROP COLUMN IF EXISTS `humhub_allowed`;')
  await queryFn('ALTER TABLE `users` DROP COLUMN IF EXISTS `humhub_publish_name`;')
}
