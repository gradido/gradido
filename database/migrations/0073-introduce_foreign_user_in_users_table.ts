export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('ALTER TABLE `users` DROP KEY IF EXISTS `gradido_id`;')
  await queryFn('ALTER TABLE `users` DROP INDEX IF EXISTS `gradido_id`;')
  await queryFn('ALTER TABLE `users` DROP KEY IF EXISTS `alias`;')
  await queryFn('ALTER TABLE `users` DROP INDEX IF EXISTS `alias`;')
  await queryFn(
    'ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `foreign` tinyint(4) NOT NULL DEFAULT 0 AFTER `id`;',
  )

  await queryFn(
    'ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `community_uuid` char(36) DEFAULT NULL NULL AFTER `gradido_id`;',
  )
  await queryFn(
    'ALTER TABLE `users` ADD CONSTRAINT uuid_key UNIQUE KEY (`gradido_id`, `community_uuid`);',
  )
  await queryFn(
    'ALTER TABLE `users` ADD CONSTRAINT alias_key UNIQUE KEY (`alias`, `community_uuid`);',
  )
  // read the community uuid of the homeCommunity
  const result = await queryFn(`SELECT c.community_uuid from communities as c WHERE c.foreign = 0`)
  // and if uuid exists enter the home_community_uuid for all local users
  if (result && result[0]) {
    await queryFn(
      `UPDATE users as u SET u.community_uuid = "${result[0].community_uuid}" WHERE u.foreign = 0 AND u.community_uuid IS NULL`,
    )
  }
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('ALTER TABLE `users` DROP KEY IF EXISTS `uuid_key`;')
  await queryFn('ALTER TABLE `users` DROP KEY IF EXISTS `alias_key`;')

  await queryFn('ALTER TABLE `users` DROP COLUMN IF EXISTS `foreign`;')
  await queryFn('ALTER TABLE `users` DROP COLUMN IF EXISTS `community_uuid`;')

  await queryFn('ALTER TABLE `users` ADD CONSTRAINT gradido_id UNIQUE KEY (`gradido_id`);')
  await queryFn('ALTER TABLE `users` ADD CONSTRAINT alias UNIQUE KEY (`alias`);')
}
