// `users.community_uuid` becomes NOT NULL: every member is named by the PAIR
// (gradido_id, community_uuid), the GraphQL field has always been non-null, and since the
// dht-node writes the home community on startup no code path writes an empty one.
//
// Checked on production before this was written: no row carries NULL.
//
// Still not a bare ALTER. MariaDB refuses NOT NULL over a NULL row ("Data truncated for
// column 'community_uuid'"), and a migration that stops there stops the deploy with a
// message that names neither the rows nor what to do about them. So first the same fill
// 0074 and 0129 did -- a no-op wherever they already ran -- and then, if anything is still
// empty, a refusal that says what it found.
//
// A fresh installation has no home community while this runs (the dht-node creates it and
// starts only after the migrations) -- and no users either: the one row it used to get,
// migration 0056's stand-in for the two rows 0042 inserted into an empty table, is gone
// since 0042 only runs on the database it was written for.
export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  const home = await queryFn('SELECT c.community_uuid FROM communities AS c WHERE c.foreign = 0')
  const homeCommunityUuid = home?.[0]?.community_uuid
  if (homeCommunityUuid) {
    await queryFn(
      'UPDATE users AS u SET u.community_uuid = ? WHERE u.foreign = 0 AND u.community_uuid IS NULL',
      [homeCommunityUuid],
    )
  }

  const empty = await queryFn(
    'SELECT COUNT(*) AS count, SUM(u.foreign = 1) AS foreignCount FROM users AS u WHERE u.community_uuid IS NULL',
  )
  const count = Number(empty?.[0]?.count ?? 0)
  if (count > 0) {
    const foreignCount = Number(empty[0].foreignCount ?? 0)
    throw new Error(
      `0134: ${count} users row(s) without community_uuid (${foreignCount} of them foreign). ` +
        (homeCommunityUuid
          ? 'Local rows were filled with the home community uuid; the rest belong to other communities and need their uuid set by hand.'
          : 'There is no home community to fill them from, and the dht-node that creates one cannot start before the migrations have run: set users.community_uuid for these rows by hand.'),
    )
  }

  await queryFn(
    'ALTER TABLE `users` CHANGE `community_uuid` `community_uuid` VARCHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL;',
  )
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    'ALTER TABLE `users` CHANGE `community_uuid` `community_uuid` VARCHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL;',
  )
}
