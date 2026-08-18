import { aliasCandidates, aliasSchema, pickFreeAlias } from 'shared'

/* MIGRATION TO add the user_aliases table and give every local user an alias */

/**
 * The table holds every name a member owns, not only the ones they left behind:
 * `users.alias` marks which of them is the current one. Taking a new name inserts a
 * row, reclaiming an earlier one only moves the marker, and leaving a name writes
 * nothing - its row is already there.
 *
 * `origin` says where a name came from, and nothing here is `chosen`: only a name the
 * member typed themselves counts against the yearly quota, and nobody has answered
 * under the new rules yet. This migration writes the two that mean "handed out" -
 * 'assigned' for the names that were already there, 'migrated' for the ones it builds
 * itself. They behave identically everywhere except in `downgrade`, which is the whole
 * reason they are told apart.
 */
export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`
    CREATE TABLE user_aliases (
      id int unsigned NOT NULL AUTO_INCREMENT,
      user_id int unsigned NOT NULL,
      alias varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
      community_uuid varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
      origin varchar(8) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'chosen',
      created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      UNIQUE KEY alias (alias, community_uuid),
      KEY user_id (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`)

  // The names that were already there get their row FIRST, and they stay 'assigned'.
  // Doing this before a single name is handed out is what keeps them apart from this
  // migration's own work - and that separation is the only reason the rollback below
  // can take back what it gave without stripping a name somebody held long before.
  await queryFn(`
    INSERT INTO user_aliases (user_id, alias, community_uuid, origin)
    SELECT u.id, u.alias, u.community_uuid, 'assigned'
      FROM users u
     WHERE u.foreign = 0 AND u.alias IS NOT NULL AND u.community_uuid IS NOT NULL;`)

  // Give every local member without one a name. The proposal is transliterated rather
  // than filtered: a name may hold any alphabet, and dropping what an alias cannot take
  // would leave a member with a Greek name holding two letters and one with a Chinese
  // name holding none.
  const users = await queryFn(
    `SELECT u.id, u.first_name, u.last_name, u.community_uuid, c.email
       FROM users u
       LEFT JOIN user_contacts c ON c.id = u.email_id
      WHERE u.foreign = 0 AND u.alias IS NULL`,
  )

  // Only local rows count, exactly as `aliasExists` decides at runtime: a `foreign = 1`
  // row is a cached copy of a member of another community, and aliases are unique per
  // community - so a name held over there must not push somebody here one rung further
  // down the ladder for no reason.
  const isTaken = async (alias: string): Promise<boolean> => {
    const rows = await queryFn(
      `SELECT u.id FROM users u WHERE u.alias = ? AND u.foreign = 0 LIMIT 1`,
      [alias],
    )
    return rows.length > 0
  }

  for (const user of users) {
    const alias = await pickFreeAlias(
      aliasCandidates(user.first_name, user.last_name, user.email),
      user.id,
      isTaken,
    )
    // The whole point of the ladder. An alias that does not parse would still be
    // written by raw SQL, and `findUserByIdentifier` decides from the schema what KIND
    // of identifier it was handed - so its owner would be unreachable at their own
    // gradido address. Better to stop the migration than to store that.
    aliasSchema.parse(alias)
    await queryFn(`UPDATE users SET alias = ? WHERE id = ?`, [alias, user.id])
    // Marked as this migration's own, not merely 'assigned'. Both mean "handed out,
    // nobody asked yet" everywhere else - the difference exists solely for the rollback.
    if (user.community_uuid) {
      await queryFn(
        `INSERT INTO user_aliases (user_id, alias, community_uuid, origin)
         VALUES (?, ?, ?, 'migrated')`,
        [user.id, alias, user.community_uuid],
      )
    }
  }
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // Taken back before the table goes, and only this migration's own work: `migrated`
  // marks the names it handed out. Everything else stays - `assigned` rows are names
  // that predate this feature, and `chosen` or `adopted` are names the member answered
  // for, a migrated one included: once somebody said "this is mine", withdrawing the
  // feature is no reason to take it off them.
  //
  // Two wider rules were tried and both destroy data: deriving the name from the member
  // again would clear a name somebody picked years ago that happens to match, and
  // clearing every `assigned` would clear every name that existed before this table.
  await queryFn(`
    UPDATE users u
      JOIN user_aliases a ON a.user_id = u.id AND a.alias = u.alias
       SET u.alias = NULL
     WHERE a.origin = 'migrated';`)

  await queryFn(`DROP TABLE IF EXISTS user_aliases;`)
}
