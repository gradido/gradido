/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    'ALTER TABLE `users` MODIFY COLUMN `foreign` tinyint(1) NOT NULL DEFAULT 0 AFTER `id`;',
  )
  await queryFn(
    'ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `gms_publish_name` int unsigned NOT NULL DEFAULT 0 AFTER `last_name`;', // COMMENT '0:alias if exists or initials only , 1:initials only, 2:firstName only, 3:firstName + Initial of LastName, 4:fullName'
  )
  await queryFn(
    'ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `gms_allowed` tinyint(1) NOT NULL DEFAULT 1;',
  )
  await queryFn(
    'ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `location` geometry DEFAULT NULL NULL AFTER `gms_allowed`;',
  )
  await queryFn(
    'ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `gms_publish_location` int unsigned NOT NULL DEFAULT 2 AFTER `location`;', // COMMENT '0:exact, 1:approximate, 2:random'
  )
  await queryFn(
    'ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `gms_registered` tinyint(1) NOT NULL DEFAULT 0;',
  )
  await queryFn(
    'ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `gms_registered_at` datetime(3) DEFAULT NULL NULL;',
  )
  await queryFn(
    'ALTER TABLE `user_contacts` ADD COLUMN IF NOT EXISTS `gms_publish_email` tinyint(1) NOT NULL DEFAULT 0 AFTER `email_checked`;', // COMMENT '0:nothing, 1:email'
  )
  await queryFn(
    'ALTER TABLE `user_contacts` ADD COLUMN IF NOT EXISTS `country_code` varchar(255) DEFAULT NULL NULL AFTER `gms_publish_email`;',
  )
  await queryFn(
    'ALTER TABLE `user_contacts` ADD COLUMN IF NOT EXISTS `gms_publish_phone` int unsigned NOT NULL DEFAULT 0 AFTER `phone`;', // COMMENT '0:nothing, 1:country_code only, 2:complet phone number'
  )
  await queryFn(
    'ALTER TABLE `communities` ADD COLUMN IF NOT EXISTS `gms_api_key` varchar(512) DEFAULT NULL NULL AFTER `description`;',
  )
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    'ALTER TABLE `users` MODIFY COLUMN `foreign` tinyint(4) NOT NULL DEFAULT 0 AFTER `id`;',
  )
  await queryFn('ALTER TABLE `users` DROP COLUMN IF EXISTS `gms_publish_name`;')
  await queryFn('ALTER TABLE `users` DROP COLUMN IF EXISTS `gms_allowed`;')
  await queryFn('ALTER TABLE `users` DROP COLUMN IF EXISTS `location`;')
  await queryFn('ALTER TABLE `users` DROP COLUMN IF EXISTS `gms_publish_location`;')
  await queryFn('ALTER TABLE `users` DROP COLUMN IF EXISTS `gms_registered`;')
  await queryFn('ALTER TABLE `users` DROP COLUMN IF EXISTS `gms_registered_at`;')
  await queryFn('ALTER TABLE `user_contacts` DROP COLUMN IF EXISTS `gms_publish_email`;')
  await queryFn('ALTER TABLE `user_contacts` DROP COLUMN IF EXISTS `country_code`;')
  await queryFn('ALTER TABLE `user_contacts` DROP COLUMN IF EXISTS `gms_publish_phone`;')
  await queryFn('ALTER TABLE `communities` DROP COLUMN IF EXISTS `gms_api_key`;')
}
