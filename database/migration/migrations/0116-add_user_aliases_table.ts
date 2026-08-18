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

  // Loop through all local users without an existing alias
  const users = await queryFn(`SELECT * FROM users u WHERE u.foreign = 0 AND u.alias IS NULL`)

  for (const user of users) {
    // generate alias from firstname minus place for three digits plus first letter of name (max 20 chars)
    let alias =
      user.first_name.replaceAll(' ', '').slice(0, 16) +
      user.last_name.replaceAll(' ', '').slice(0, 1)

    // check if alias already exists
    const existing = await queryFn(
      `SELECT u.alias FROM users u WHERE u.foreign = 0 AND u.alias LIKE ?`,
      [alias + '%'],
    )

    if (existing.length > 0) {
      let maxNumberPart = 0
      let hasExactMatch = false

      // check if existing aliases match the generated alias pattern and distingue only by a following number
      for (const e of existing) {
        const numberPart = e.alias.slice(alias.length)
        if (numberPart.length > 0 && !isNaN(parseInt(numberPart))) {
          const number = parseInt(numberPart)
          if (number > maxNumberPart) {
            maxNumberPart = number
          }
        } else if (numberPart.length === 0) {
          hasExactMatch = true
          continue
        } else {
          // not the same and numbered alias, skip
          continue
        }
      }
      if (maxNumberPart > 0 || hasExactMatch) {
        // append incremented number
        const newNumber = maxNumberPart + 1
        alias = alias + newNumber.toString()
      }
    }

    // ensure final alias doesn't exceed 20 chars
    if (alias.length > 20) {
      throw new Error(`Alias too long: ${alias}`)
    }

    // update user with alias
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
  await queryFn(`DROP TABLE IF EXISTS user_aliases;`)

  // Loop through all local users with an alias
  const users = await queryFn(`SELECT * FROM users u WHERE u.foreign = 0 AND u.alias is not null`)

  for (const user of users) {
    // generate alias from firstname minus place for three digits plus first letter of name (max 20 chars)
    const generatedAlias =
      user.first_name.replaceAll(' ', '').slice(0, 16) +
      user.last_name.replaceAll(' ', '').slice(0, 1)

    // check if alias matches the generated alias pattern
    if (
      user.alias === generatedAlias ||
      (user.alias.startsWith(generatedAlias) &&
        user.alias.substring(generatedAlias.length).match(/^\d+$/))
    ) {
      // remove alias because it was a automatic migrated one
      await queryFn(`UPDATE users SET alias = NULL WHERE id = ?`, [user.id])
    }
  }
}
