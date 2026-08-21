// AI-GENERATED — not an architecture reference
// The rate limit of the e-mail change reads "the youngest event of one type about one
// member" (`dbFindLatestEventForAffectedUser`). The events table had no index a lookup
// like that could use - every call walked the whole table and sorted it. This index lets
// the lookup go straight to the member's events of that type, youngest first.

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    'ALTER TABLE `events` ADD INDEX `IDX_events_type_affected_user_created` (`type`, `affected_user_id`, `created_at`);',
  )
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('ALTER TABLE `events` DROP INDEX `IDX_events_type_affected_user_created`;')
}
