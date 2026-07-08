/* MIGRATION TO add new alias history table */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`
    CREATE TABLE alias_history (
      id int unsigned NOT NULL AUTO_INCREMENT,
      user_id int unsigned NOT NULL,
      alias varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
      community_uuid varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
      first_usage_at datetime(3) DEFAULT NULL,
      created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      UNIQUE KEY alias (alias, community_uuid)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`)

  await queryFn(
    `ALTER TABLE users ADD alias_startupdate_at datetime(3) DEFAULT NULL after alias;`,
  )
  await queryFn(
    `ALTER TABLE users ADD alias_update_count int DEFAULT 0 after alias_startupdate_at;`,
  )
  await queryFn(
    `ALTER TABLE users ADD alias_first_usage_at datetime(3) DEFAULT NULL after alias_update_count;`,
  )

  // Loop through all user without an existing alias
  const users = await queryFn(`SELECT * FROM users u WHERE u.foreign = 0 AND u.alias IS NULL`)
  console.log('Users without alias:', users.length)
  
  for (const user of users) {
    console.log('Processing user:', JSON.stringify(user))
    // generate alias from firstname minus place for three digits plus first letter of name (max 20 chars)
    let alias = user.first_name.replaceAll(' ', '').slice(0, 16) + user.last_name.replaceAll(' ', '').slice(0, 1)
    console.log('Generated alias:', alias)

    // check if alias already exists
    const existing = await queryFn(`SELECT u.alias FROM users u WHERE u.foreign = 0 AND u.alias LIKE ?`, [alias + '%'])
    console.log('Existing aliases:', JSON.stringify(existing))
    
    if (existing.length > 0) {
      let maxNumberPart = 0
      let hasExactMatch = false
      
      // check if existing aliases match the generated alias pattern and distingue only by a following number
      for (const e of existing) {
        console.log('Checking existing alias:', e.alias)
        const numberPart = e.alias.slice(alias.length)
        console.log('Number part:', numberPart)
        if(numberPart.length > 0 && !isNaN(parseInt(numberPart))) {
          const number = parseInt(numberPart)
          console.log('Number:', number)
          if (number > maxNumberPart) {
            maxNumberPart = number
            console.log('Max number part:', maxNumberPart)
          }
        } else if (numberPart.length === 0) {
          hasExactMatch = true
          console.log(`Exact match`)
          continue
        } else {
          console.log('Not the same and numbered alias, skipping')
          // not the same and numbered alias, skip
          continue
        }
      }
      console.log('Max number:', maxNumberPart, 'hasExactMatch:', hasExactMatch)
      if (maxNumberPart > 0 || hasExactMatch) {
        // append incremented number
        const newNumber = maxNumberPart + 1
        alias = alias + newNumber.toString()
        console.log('Final alias:', alias)
      }
    }
    
    // ensure final alias doesn't exceed 20 chars
    if (alias.length > 20) {
      throw Error(`Alias too long: ${alias}`)
    }
    
    // update user with alias
    await queryFn(`UPDATE users SET alias = ? WHERE id = ?`, [alias, user.id])
    console.log('Updated user:', user.id, 'with alias:', alias)
  }    
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`DROP TABLE IF EXISTS alias_history;`)
  await queryFn(`ALTER TABLE users DROP COLUMN IF EXISTS alias_startupdate_at;`)
  await queryFn(`ALTER TABLE users DROP COLUMN IF EXISTS alias_update_count;`)
  await queryFn(`ALTER TABLE users DROP COLUMN IF EXISTS alias_first_usage_at;`)

  // TODO: Revert alias column to original state (remove alias column)
    // Loop through all user without an existing alias
  const users = await queryFn(`SELECT * FROM users u WHERE u.foreign = 0 AND u.alias is not null`)
  console.log('Users without alias:', users.length)
  
  for (const user of users) {
    console.log('Processing user:', JSON.stringify(user))
    // generate alias from firstname minus place for three digits plus first letter of name (max 20 chars)
    let generatedAlias = user.first_name.replaceAll(' ', '').slice(0, 16) + user.last_name.replaceAll(' ', '').slice(0, 1)
    console.log('Generated alias:', generatedAlias)

    // check if alias matches the generated alias pattern
    if ((user.alias === generatedAlias) || 
        (user.alias.startsWith(generatedAlias) && user.alias.substring(generatedAlias.length).match(/^\d+$/))) {
      console.log(`Alias matches generated alias pattern alias=${user.alias}, generated=${generatedAlias}`)
      // remove alias because it was a automatic migrated one
      await queryFn(`UPDATE users SET alias = NULL WHERE id = ?`, [user.id])
      console.log('Removed alias from user:', user.id)
    } else {
      console.log(`Alias does not match generated alias pattern alias=${user.alias}, generated=${generatedAlias}`)
    }
  }  

}
