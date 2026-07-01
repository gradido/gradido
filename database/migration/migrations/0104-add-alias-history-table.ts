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
  const users = await queryFn(`SELECT * FROM users where alias is null`)
  console.log('Users without alias:', users.length)
  
  for (const user of users) {
    console.log('Processing user:', JSON.stringify(user))
    // generate alias from firstname minus place for three digits plus first letter of name (max 20 chars)
    let alias = user.first_name.replaceAll(' ', '').slice(0, 16) + user.last_name.slice(0, 1)
    console.log('Generated alias:', alias)
    /*
    if (alias.length > 20) {
      alias = alias.slice(0, 20)
    }
    */
    // check if alias already exists
    const existing = await queryFn(`SELECT alias FROM users WHERE alias LIKE ?`, [alias + '%'])
    console.log('Existing aliases:', JSON.stringify(existing))
    
    if (existing.length > 0) {
      // find the highest number suffix for this base alias pattern
      const numberedAliases = await queryFn(
        `SELECT alias FROM users WHERE alias REGEXP ? ORDER BY alias DESC`,
        [`^${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[0-9]+$`]
      )
      console.log('Numbered aliases:', JSON.stringify(numberedAliases))
      
      let maxNumber = 0
      if (numberedAliases.length > 0) {
        // extract the number from the last alias
        const lastAlias = numberedAliases[0].alias
        const match = lastAlias.match(/(\d+)$/)
        if (match) {
          maxNumber = parseInt(match[1], 10)
        }
      }
      console.log('Max number:', maxNumber)

      // append incremented number
      const newNumber = maxNumber + 1
      alias = alias + newNumber.toString()
      console.log('Final alias:', alias)
    }
    
    // ensure final alias doesn't exceed 20 chars
    if (alias.length > 20) {
      alias = alias.slice(0, 20)
    }
    
    // update user with alias
    await queryFn(`UPDATE users SET alias = ? WHERE id = ?`, [alias, user.id])
    console.log('Updated user:', user.id, 'with alias:', alias)
  }  
  /*
  // Loop through all user without an existing alias
  const users = await queryFn(`SELECT * FROM users where alias is null`)
  users.forEach(async (user) => {
    // and migrate for each user firstname and name to an automatic generated alias

    // generate alias from firstname plus first letter of name
    const alias = user.firstname.slice(0, user.firstname.length > 16 ? 16 : user.firstname.length) + user.name.slice(0, 1);
    // check if alias already exists
    const exists = await queryFn(`SELECT count(*) as count FROM users WHERE alias LIKE ?`, [alias + '%']);
    // if alias exists, generate a new one
    if (exists[0].count > 0) {
      const maxCount = await queryFn(`SELECT MAX(CAST(SUBSTRING(alias, LENGTH(?)+2) AS UNSIGNED)) as max_count FROM users WHERE alias LIKE ?`, [alias, alias + '%']);
      // append a number to the alias
      const newAlias = alias + (maxCount[0].max_count + 1);
      // check if new alias already exists
      const newExists = await queryFn(`SELECT count(*) as count FROM users WHERE alias = ?`, [newAlias]);
      if (newExists[0].count > 0) {
        // if new alias exists, append another number
        const finalAlias = newAlias + '1';
        // update user with new alias
        await queryFn(`UPDATE users SET alias = ? WHERE id = ?`, [finalAlias, user.id]);
      } else {
        // update user with new alias
        await queryFn(`UPDATE users SET alias = ? WHERE id = ?`, [newAlias, user.id]);
      }
    } else {
      // update user with new alias
      await queryFn(`UPDATE users SET alias = ? WHERE id = ?`, [alias, user.id]);
    }
  }) 
  */
  

}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`DROP TABLE alias_history;`)
  await queryFn(`ALTER TABLE users DROP COLUMN alias_startupdate_at;`)
  await queryFn(`ALTER TABLE users DROP COLUMN alias_update_count;`)
  await queryFn(`ALTER TABLE users DROP COLUMN alias_first_usage_at;`)
}
