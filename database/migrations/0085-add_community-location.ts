export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    'ALTER TABLE `communities` ADD COLUMN IF NOT EXISTS `location` geometry DEFAULT NULL NULL AFTER `community_uuid`;',
  )
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('ALTER TABLE `communities` DROP COLUMN IF EXISTS `location`;')
}
