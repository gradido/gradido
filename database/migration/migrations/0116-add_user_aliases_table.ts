import { aliasCandidates, aliasSchema, pickFreeAlias } from 'shared'

/* MIGRATION TO add the user_aliases table and give every local user an alias */

/**
 * The table holds every name a member owns, not only the ones they left behind:
 * `users.alias` marks which of them is the current one. Taking a new name inserts a
 * row, reclaiming an earlier one only moves the marker, and leaving a name writes
 * nothing - its row is already there.
 *
 * `origin` separates a name the system handed out from one the member picked. Only
 * picked ones count against the yearly quota, which is why everything that existed
 * before this feature is recorded as 'assigned': nobody has made a choice under the
 * new rules yet.
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

  // Give every local member without one a name. The proposal is transliterated rather
  // than filtered: a name may hold any alphabet, and dropping what an alias cannot take
  // would leave a member with a Greek name holding two letters and one with a Chinese
  // name holding none.
  const users = await queryFn(
    `SELECT u.id, u.first_name, u.last_name, c.email
       FROM users u
       LEFT JOIN user_contacts c ON c.id = u.email_id
      WHERE u.foreign = 0 AND u.alias IS NULL`,
  )

  const isTaken = async (alias: string): Promise<boolean> => {
    const rows = await queryFn(`SELECT u.id FROM users u WHERE u.alias = ? LIMIT 1`, [alias])
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
  }

  // Every local user who now holds an alias gets its row. Aliases that predate this
  // feature count as handed out, not chosen - see the note above.
  await queryFn(`
    INSERT INTO user_aliases (user_id, alias, community_uuid, origin)
    SELECT u.id, u.alias, u.community_uuid, 'assigned'
      FROM users u
     WHERE u.foreign = 0 AND u.alias IS NOT NULL AND u.community_uuid IS NOT NULL;`)
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // Taken back before the table goes, and known by name rather than guessed: a row
  // still marked `assigned` is one this migration handed out. Deriving the name from
  // the member again - as an earlier version did - would also clear a name somebody
  // chose for themselves years ago and that happened to match.
  await queryFn(`
    UPDATE users u
      JOIN user_aliases a ON a.user_id = u.id AND a.alias = u.alias
       SET u.alias = NULL
     WHERE a.origin = 'assigned';`)

  await queryFn(`DROP TABLE IF EXISTS user_aliases;`)
}
