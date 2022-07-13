/* MIGRATION for updating transactions from the past to follow the blockchain rules */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // split creation transaction with 3000 GDD created in one transaction what isn't allowed
  const transactionMemos: string[] = [
    'Aktives Grundeinkommen für GL. Dez',
    'Aktives Grundeinkommen für GL. Jan',
    'Aktives Grundeinkommen für GL. Feb',
  ]
  const creationDate = new Date('2020-03-30 06:59:55')

  await queryFn(
    `UPDATE \`transactions\` set \`amount\` = 1000, \`balance\` = 1000, \`memo\` = ? WHERE \`id\` = 150`,
    [transactionMemos[0]],
  )

  // [ RowDataPacket { 'MAX(`id`)': 6828 } ]
  const lastTransactionId = (await queryFn(`SELECT MAX(\`id\`) as max_id from \`transactions\``))[0]
    .max_id
  // dummy id to insert two transactions before this (previous has an index on it)
  await queryFn(`UPDATE \`transactions\` set \`previous\` = ? WHERE \`id\` = 278`, [
    lastTransactionId + 30,
  ])

  await queryFn(
    `INSERT INTO \`transactions\`(
            \`user_id\`, \`previous\`, \`type_id\`, \`amount\`, \`balance\`,
            \`balance_date\`, \`decay\`, \`memo\`, \`creation_date\`
          ) VALUES(
            275, 150, 1, 1000, 2000,
            ?, 0, ?, ?
          )`,
    [
      creationDate,
      transactionMemos[1],
      new Date(creationDate.getFullYear(), creationDate.getMonth() - 1, 1),
    ],
  )
  await queryFn(
    `INSERT INTO \`transactions\`(
            \`user_id\`, \`previous\`, \`type_id\`, \`amount\`, \`balance\`,
            \`balance_date\`, \`decay\`, \`memo\`, \`creation_date\`
          ) VALUES(
            275, LAST_INSERT_ID(), 1, 1000, 3000,
            ?, 0, ?, ?
          )`,
    [
      creationDate,
      transactionMemos[2],
      new Date(creationDate.getFullYear(), creationDate.getMonth() - 2, 1),
    ],
  )
  await queryFn(`UPDATE \`transactions\` set \`previous\` = LAST_INSERT_ID() WHERE \`id\` = 278`)

  // ----------------------------------------------------------------------------------------------
  // update creation_date for transactions with creation_date == balance_date
  /* js code for generating mysql raw queries
  // print mysql raw querys
  interface ReplaceSet {
    monthName: RegExp
    monthValue: number
  }
  // js month starting with 0 for Jan
  const replaceSets: ReplaceSet[] = [
    { monthName: new RegExp('.*Dez.*'), monthValue: -1},
    { monthName: new RegExp('.*Jan.*'), monthValue: 0 },
    { monthName: new RegExp('.*Feb.*'), monthValue: 1 },
    { monthName: new RegExp('.*M.rz.*'), monthValue: 2 },
    { monthName: new RegExp('.*April.*'), monthValue: 3 },
  ]
  const transaction_ids = await queryFn(`
    SELECT id, balance_date, creation_date, memo 
    FROM \`transactions\` 
    WHERE \`balance_date\` = \`creation_date\`
    AND \`type_id\` = 1
  `)
  let downgradeQueries = ''
  for(let id in transaction_ids) {
    const transaction = transaction_ids[id]
    let updatedCreationDate: Date | null = null
    // determine correct creation date
    for(const replaceSet of replaceSets) {
      // check if target creation can be determine which help of the memo
      if(transaction.memo.match(replaceSet.monthName)) {
        const oldCreationDate = transaction.creation_date        
        updatedCreationDate = new Date(oldCreationDate)
        updatedCreationDate.setMonth(replaceSet.monthValue)
        break
      }
    }
    // couldn't find info in memo, simply set date 1 month back
    if(updatedCreationDate === null) {
      //date.setMonth(date.getMonth() - numOfMonths);
      updatedCreationDate = new Date(transaction.creation_date)
      updatedCreationDate.setMonth(transaction.creation_date.getMonth() - 1)
    }
    if(updatedCreationDate.getMonth() == 1) {
      // only 28 februars exist so let us fix it
      if(updatedCreationDate.getDate() > 28) {
        updatedCreationDate.setDate(28)
      }
    }
    console.log('// %s, original creation date: %s\nawait queryFn(`UPDATE \\`transactions\\` SET creation_date = \'%s\' WHERE \\`id\\` = %d`)\n', 
        transaction.memo, 
        transaction.creation_date.toISOString().slice(0, 19).replace('T', ' '),
        updatedCreationDate.toISOString().slice(0, 19).replace('T', ' '), 
        transaction.id
    )
    downgradeQueries += 'await queryFn(`UPDATE \\`transactions\\` SET creation_date = \''
    downgradeQueries += transaction.creation_date.toISOString().slice(0, 19).replace('T', ' ')
    downgradeQueries += '\' WHERE \\`id\\` = '
    downgradeQueries += transaction.id
    downgradeQueries += '`)\n'
  }
  console.log("downgrade: \n%s", downgradeQueries)
  console.log("transactions count: %d", transaction_ids.length) // 224
*/

  // Erste Schöpfung, viel Spaß damit ;), original creation date: 2019-12-17 13:06:13
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2019-11-17 13:06:13' WHERE \`id\` = 1`,
  )

  // Erste Schöpfung, viel Spaß damit ;), original creation date: 2019-12-17 13:06:16
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2019-11-17 13:06:16' WHERE \`id\` = 2`,
  )

  // Erste Schöpfung, viel Spaß damit ;), original creation date: 2019-12-17 13:06:19
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2019-11-17 13:06:19' WHERE \`id\` = 3`,
  )

  // Erste Schöpfung, viel Spaß damit ;), original creation date: 2019-12-17 13:06:21
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2019-11-17 13:06:21' WHERE \`id\` = 4`,
  )

  // Test1 , original creation date: 2019-12-17 13:07:01
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2019-11-17 13:07:01' WHERE \`id\` = 5`,
  )

  // EIn bisschen Nachschub für dich ;), original creation date: 2019-12-19 17:35:16
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2019-11-19 17:35:16' WHERE \`id\` = 6`,
  )

  // AGE Dezember 2019, original creation date: 2020-01-08 10:34:40
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2019-12-08 10:34:40' WHERE \`id\` = 7`,
  )

  // AGE Dezember 2019, original creation date: 2020-01-08 11:02:41
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2019-12-08 11:02:41' WHERE \`id\` = 8`,
  )

  // AGE Dezember 2019, original creation date: 2020-01-08 11:06:42
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2019-12-08 11:06:42' WHERE \`id\` = 9`,
  )

  // AGE Dezember 2019, original creation date: 2020-01-08 11:16:11
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2019-12-08 11:16:11' WHERE \`id\` = 10`,
  )

  // AGE Dezember 2019, original creation date: 2020-01-08 11:16:15
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2019-12-08 11:16:15' WHERE \`id\` = 11`,
  )

  // Für deine tolle Arbeit ;), original creation date: 2020-01-08 13:24:29
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2019-12-08 13:24:29' WHERE \`id\` = 12`,
  )

  // AGE Dezember 2019, original creation date: 2020-01-09 12:02:48
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2019-12-09 12:02:48' WHERE \`id\` = 13`,
  )

  // AGE Dezember 2019, original creation date: 2020-01-09 12:02:52
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2019-12-09 12:02:52' WHERE \`id\` = 14`,
  )

  // AGE Dezember 2019, original creation date: 2020-01-09 12:02:54
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2019-12-09 12:02:54' WHERE \`id\` = 15`,
  )

  // AGE Dezember 2019, original creation date: 2020-01-09 12:09:08
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2019-12-09 12:09:08' WHERE \`id\` = 16`,
  )

  // AGE Dezember 2019, original creation date: 2020-01-11 11:10:55
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2019-12-11 11:10:55' WHERE \`id\` = 17`,
  )

  // AGE Dezember 2019, original creation date: 2020-01-11 11:11:24
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2019-12-11 11:11:24' WHERE \`id\` = 18`,
  )

  // AGE Dezember 2019, original creation date: 2020-01-11 11:12:09
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2019-12-11 11:12:09' WHERE \`id\` = 19`,
  )

  // AGE Dezember 2019, original creation date: 2020-01-11 11:31:20
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2019-12-11 11:31:20' WHERE \`id\` = 20`,
  )

  // AGE Dezember 2019, original creation date: 2020-01-11 11:37:13
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2019-12-11 11:37:13' WHERE \`id\` = 21`,
  )

  // AGE Dezember 2019, original creation date: 2020-01-11 11:37:42
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2019-12-11 11:37:42' WHERE \`id\` = 22`,
  )

  // AGE Dezember 2019, original creation date: 2020-01-11 19:01:06
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2019-12-11 19:01:06' WHERE \`id\` = 23`,
  )

  // AGE Dezember 2019, original creation date: 2020-01-13 16:27:07
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2019-12-13 16:27:07' WHERE \`id\` = 24`,
  )

  // AGE Dezember 2019, original creation date: 2020-01-13 16:28:05
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2019-12-13 16:28:05' WHERE \`id\` = 25`,
  )

  // AGE Dezember 2019, original creation date: 2020-01-13 16:28:57
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2019-12-13 16:28:57' WHERE \`id\` = 26`,
  )

  // AGE Dezember 2019, original creation date: 2020-01-13 16:29:45
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2019-12-13 16:29:45' WHERE \`id\` = 27`,
  )

  // AGE Dezember 2019, original creation date: 2020-01-17 13:47:28
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2019-12-17 13:47:28' WHERE \`id\` = 28`,
  )

  // AGE Dezember 2019, original creation date: 2020-01-17 13:48:52
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2019-12-17 13:48:52' WHERE \`id\` = 29`,
  )

  // AGE Dezember 2019, original creation date: 2020-01-17 13:49:21
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2019-12-17 13:49:21' WHERE \`id\` = 30`,
  )

  // AGE Dezember 2019, original creation date: 2020-01-23 13:08:44
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2019-12-23 13:08:44' WHERE \`id\` = 31`,
  )

  // AGE Dezember 2019, original creation date: 2020-01-27 08:12:16
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2019-12-27 08:12:16' WHERE \`id\` = 32`,
  )

  // AGE Dezember 2019, original creation date: 2020-01-30 14:49:58
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2019-12-30 14:49:58' WHERE \`id\` = 33`,
  )

  // AGE Dezember 2019, original creation date: 2020-01-30 14:50:35
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2019-12-30 14:50:35' WHERE \`id\` = 34`,
  )

  // AGE Dezember 2019, original creation date: 2020-01-30 14:50:55
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2019-12-30 14:50:55' WHERE \`id\` = 35`,
  )

  // AGE Dezember 2019, original creation date: 2020-01-30 14:52:03
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2019-12-30 14:52:03' WHERE \`id\` = 36`,
  )

  // AGE Dezember 2019, original creation date: 2020-01-30 14:52:33
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2019-12-30 14:52:33' WHERE \`id\` = 37`,
  )

  // AGE Dezember 2019, original creation date: 2020-01-30 14:52:53
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2019-12-30 14:52:53' WHERE \`id\` = 38`,
  )

  // AGE Dezember 2019, original creation date: 2020-01-30 14:53:45
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2019-12-30 14:53:45' WHERE \`id\` = 39`,
  )

  // AGE Dezember 2019, original creation date: 2020-01-30 14:54:13
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2019-12-30 14:54:13' WHERE \`id\` = 40`,
  )

  // AGE Dezember 2019, original creation date: 2020-01-30 14:54:50
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2019-12-30 14:54:50' WHERE \`id\` = 41`,
  )

  // AGE Dezember 2019, original creation date: 2020-01-30 15:03:26
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2019-12-30 15:03:26' WHERE \`id\` = 42`,
  )

  // AGE Dezember 2019, original creation date: 2020-01-30 15:10:39
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2019-12-30 15:10:39' WHERE \`id\` = 43`,
  )

  // AGE Dezember 2019, original creation date: 2020-01-30 15:13:10
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2019-12-30 15:13:10' WHERE \`id\` = 44`,
  )

  // AGE Dezember 2019, original creation date: 2020-01-30 15:26:45
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2019-12-30 15:26:45' WHERE \`id\` = 45`,
  )

  // Grundeinkommen für Gemeinschaftsleistungen Jan. 2020, original creation date: 2020-02-19 08:54:31
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-01-19 08:54:31' WHERE \`id\` = 46`,
  )

  // Grundeinkommen für Gemeinschaftsleistungen Jan. 2020, original creation date: 2020-02-19 08:55:30
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-01-19 08:55:30' WHERE \`id\` = 47`,
  )

  // Grundeinkommen für Gemeinschaftsleistungen Jan. 2020, original creation date: 2020-02-19 08:55:33
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-01-19 08:55:33' WHERE \`id\` = 48`,
  )

  // Grundeinkommen für Gemeinschaftsleistungen Jan. 2020, original creation date: 2020-02-19 08:55:36
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-01-19 08:55:36' WHERE \`id\` = 49`,
  )

  // Grundeinkommen für Gemeinschaftsleistungen Jan. 2020, original creation date: 2020-02-19 08:55:39
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-01-19 08:55:39' WHERE \`id\` = 50`,
  )

  // Grundeinkommen für Gemeinschaftsleistungen Jan. 2020, original creation date: 2020-02-19 08:55:43
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-01-19 08:55:43' WHERE \`id\` = 51`,
  )

  // Grundeinkommen für Gemeinschaftsleistungen Jan. 2020, original creation date: 2020-02-19 08:55:46
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-01-19 08:55:46' WHERE \`id\` = 52`,
  )

  // Grundeinkommen für Gemeinschaftsleistungen Jan. 2020, original creation date: 2020-02-19 08:55:48
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-01-19 08:55:48' WHERE \`id\` = 53`,
  )

  // Grundeinkommen für Gemeinschaftsleistungen Jan. 2020, original creation date: 2020-02-19 08:55:50
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-01-19 08:55:50' WHERE \`id\` = 54`,
  )

  // Grundeinkommen für Gemeinschaftsleistungen Jan. 2020, original creation date: 2020-02-19 08:55:52
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-01-19 08:55:52' WHERE \`id\` = 55`,
  )

  // Grundeinkommen für Gemeinschaftsleistungen Jan. 2020, original creation date: 2020-02-19 08:55:54
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-01-19 08:55:54' WHERE \`id\` = 56`,
  )

  // Grundeinkommen für Gemeinschaftsleistungen Jan. 2020, original creation date: 2020-02-19 08:55:56
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-01-19 08:55:56' WHERE \`id\` = 57`,
  )

  // Grundeinkommen für Gemeinschaftsleistungen Jan. 2020, original creation date: 2020-02-19 08:55:59
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-01-19 08:55:59' WHERE \`id\` = 58`,
  )

  // Grundeinkommen für Gemeinschaftsleistungen Jan. 2020, original creation date: 2020-02-19 08:56:02
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-01-19 08:56:02' WHERE \`id\` = 59`,
  )

  // Grundeinkommen für Gemeinschaftsleistungen Jan. 2020, original creation date: 2020-02-19 08:56:05
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-01-19 08:56:05' WHERE \`id\` = 60`,
  )

  // Grundeinkommen für Gemeinschaftsleistungen Jan. 2020, original creation date: 2020-02-19 08:56:07
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-01-19 08:56:07' WHERE \`id\` = 61`,
  )

  // Grundeinkommen für Gemeinschaftsleistungen Jan. 2020, original creation date: 2020-02-19 08:56:10
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-01-19 08:56:10' WHERE \`id\` = 62`,
  )

  // Grundeinkommen für Gemeinschaftsleistungen Jan. 2020, original creation date: 2020-02-19 08:56:12
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-01-19 08:56:12' WHERE \`id\` = 63`,
  )

  // Grundeinkommen für Gemeinschaftsleistungen Jan. 2020, original creation date: 2020-02-19 08:56:14
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-01-19 08:56:14' WHERE \`id\` = 64`,
  )

  // Grundeinkommen für Gemeinschaftsleistungen Jan. 2020, original creation date: 2020-02-19 08:56:21
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-01-19 08:56:21' WHERE \`id\` = 65`,
  )

  // Grundeinkommen für Gemeinschaftsleistungen Jan. 2020, original creation date: 2020-02-19 08:56:24
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-01-19 08:56:24' WHERE \`id\` = 66`,
  )

  // Grundeinkommen für Gemeinschaftsleistungen Jan. 2020, original creation date: 2020-02-19 08:56:26
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-01-19 08:56:26' WHERE \`id\` = 67`,
  )

  // Grundeinkommen für Gemeinschaftsleistungen Jan. 2020, original creation date: 2020-02-19 08:56:28
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-01-19 08:56:28' WHERE \`id\` = 68`,
  )

  // Grundeinkommen für Gemeinschaftsleistungen Jan. 2020, original creation date: 2020-02-19 08:56:31
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-01-19 08:56:31' WHERE \`id\` = 69`,
  )

  // Grundeinkommen rückwirkend Dezember, original creation date: 2020-02-20 06:40:36
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2019-12-20 06:40:36' WHERE \`id\` = 70`,
  )

  // Grundeinkommen für GLJanuar 2020, original creation date: 2020-02-20 06:43:41
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-01-20 06:43:41' WHERE \`id\` = 71`,
  )

  // Grundeinkommen für GLJanuar 2020, original creation date: 2020-02-20 06:43:43
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-01-20 06:43:43' WHERE \`id\` = 72`,
  )

  // Grundeinkommen für GLJanuar 2020, original creation date: 2020-02-20 06:43:45
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-01-20 06:43:45' WHERE \`id\` = 73`,
  )

  // Grundeinkommen für GLJanuar 2020, original creation date: 2020-02-20 06:43:47
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-01-20 06:43:47' WHERE \`id\` = 74`,
  )

  // Grundeinkommen, original creation date: 2020-02-20 07:09:05
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-01-20 07:09:05' WHERE \`id\` = 75`,
  )

  // Grundeinkommen für GLJanuar 2020, original creation date: 2020-02-20 08:03:31
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-01-20 08:03:31' WHERE \`id\` = 76`,
  )

  // AGE für Gemeinschaftsleistungen Januar 2020, original creation date: 2020-02-29 16:17:24
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-01-29 16:17:24' WHERE \`id\` = 77`,
  )

  // AGE für Gemeinschaftsleistungen Januar 2020, original creation date: 2020-02-29 16:17:35
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-01-29 16:17:35' WHERE \`id\` = 78`,
  )

  // AGE für Gemeinschaftsleistungen Januar 2020, original creation date: 2020-02-29 16:17:42
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-01-29 16:17:42' WHERE \`id\` = 79`,
  )

  // AGE für Gemeinschaftsleistungen Januar 2020, original creation date: 2020-02-29 16:29:47
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-01-29 16:29:47' WHERE \`id\` = 80`,
  )

  // AGE für Gemeinschaftsleistungen Januar 2020, original creation date: 2020-02-29 16:29:48
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-01-29 16:29:48' WHERE \`id\` = 81`,
  )

  // AGE für Gemeinschaftsleistungen Januar 2020, original creation date: 2020-02-29 16:29:55
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-01-29 16:29:55' WHERE \`id\` = 82`,
  )

  // AGE rückwirkend für Januar 2020, original creation date: 2020-03-04 09:08:54
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-01-04 09:08:54' WHERE \`id\` = 83`,
  )

  // AGE für Gemeinschaftsleitungen Januar, original creation date: 2020-03-07 07:59:42
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-01-07 07:59:42' WHERE \`id\` = 84`,
  )

  // AGE für Gemeinschaftsleitungen Januar, original creation date: 2020-03-07 07:59:51
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-01-07 07:59:51' WHERE \`id\` = 85`,
  )

  // AGE für Gemeinschaftsleitungen Januar, original creation date: 2020-03-07 07:59:54
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-01-07 07:59:54' WHERE \`id\` = 86`,
  )

  // AGE für Gemeinschaftsleitungen Januar, original creation date: 2020-03-07 07:59:57
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-01-07 07:59:57' WHERE \`id\` = 87`,
  )

  // AGE für Gemeinschaftsleistungen Februar 2020, original creation date: 2020-03-07 08:15:48
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-07 08:15:48' WHERE \`id\` = 88`,
  )

  // AGE für Gemeinschaftsleistungen Februar 2020, original creation date: 2020-03-07 08:15:53
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-07 08:15:53' WHERE \`id\` = 89`,
  )

  // AGE für Gemeinschaftsleistungen Februar 2020, original creation date: 2020-03-07 08:15:56
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-07 08:15:56' WHERE \`id\` = 90`,
  )

  // AGE für Gemeinschaftsleistungen Februar 2020, original creation date: 2020-03-07 08:15:59
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-07 08:15:59' WHERE \`id\` = 91`,
  )

  // AGE für Gemeinschaftsleistungen Februar 2020, original creation date: 2020-03-07 08:16:01
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-07 08:16:01' WHERE \`id\` = 92`,
  )

  // AGE für Gemeinschaftsleistungen Februar 2020, original creation date: 2020-03-07 08:16:05
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-07 08:16:05' WHERE \`id\` = 93`,
  )

  // AGE für Gemeinschaftsleistungen Februar 2020, original creation date: 2020-03-07 08:16:07
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-07 08:16:07' WHERE \`id\` = 94`,
  )

  // AGE für Gemeinschaftsleistungen Februar 2020, original creation date: 2020-03-07 08:16:10
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-07 08:16:10' WHERE \`id\` = 95`,
  )

  // AGE für Gemeinschaftsleistungen Februar 2020, original creation date: 2020-03-07 08:17:00
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-07 08:17:00' WHERE \`id\` = 96`,
  )

  // AGE für Gemeinschaftsleistungen Februar 2020, original creation date: 2020-03-07 08:17:03
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-07 08:17:03' WHERE \`id\` = 97`,
  )

  // AGE für Gemeinschaftsleistungen Februar 2020, original creation date: 2020-03-07 08:17:05
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-07 08:17:05' WHERE \`id\` = 98`,
  )

  // AGE für Gemeinschaftsleistungen Februar 2020, original creation date: 2020-03-07 08:17:07
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-07 08:17:07' WHERE \`id\` = 99`,
  )

  // AGE für Gemeinschaftsleistungen Februar 2020, original creation date: 2020-03-07 08:17:09
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-07 08:17:09' WHERE \`id\` = 100`,
  )

  // AGE für Gemeinschaftsleistungen Februar 2020, original creation date: 2020-03-07 08:17:11
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-07 08:17:11' WHERE \`id\` = 101`,
  )

  // AGE für Gemeinschaftsleistungen Februar 2020, original creation date: 2020-03-07 08:17:13
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-07 08:17:13' WHERE \`id\` = 102`,
  )

  // AGE für Gemeinschaftsleistungen Februar 2020, original creation date: 2020-03-07 08:17:21
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-07 08:17:21' WHERE \`id\` = 103`,
  )

  // AGE für Gemeinschaftsleistungen Februar 2020, original creation date: 2020-03-07 08:17:25
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-07 08:17:25' WHERE \`id\` = 104`,
  )

  // AGE für Gemeinschaftsleistungen Februar 2020, original creation date: 2020-03-07 08:17:28
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-07 08:17:28' WHERE \`id\` = 105`,
  )

  // AGE für Gemeinschaftsleistungen Februar, original creation date: 2020-03-07 08:19:15
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-07 08:19:15' WHERE \`id\` = 106`,
  )

  // AGE für Gemeinschaftsleistungen Februar 2020 geschöpft und gutgeschrieben., original creation date: 2020-03-08 18:00:20
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-08 18:00:20' WHERE \`id\` = 107`,
  )

  // AGE für Februar, original creation date: 2020-03-09 11:43:30
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-09 11:43:30' WHERE \`id\` = 108`,
  )

  // AGE für Gemeinschaftsleistungen Februar 2020, original creation date: 2020-03-09 17:48:34
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-09 17:48:34' WHERE \`id\` = 109`,
  )

  // AGE für Gemeinschaftsleistungen Februar 2020, original creation date: 2020-03-09 17:48:36
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-09 17:48:36' WHERE \`id\` = 110`,
  )

  // AGE für Gemeinschaftsleistungen Februar 2020, original creation date: 2020-03-09 17:48:38
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-09 17:48:38' WHERE \`id\` = 111`,
  )

  // AGE für Gemeinschaftsleistungen Februar 2020, original creation date: 2020-03-09 17:48:40
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-09 17:48:40' WHERE \`id\` = 112`,
  )

  // AGE für Gemeinschaftsleistungen Februar 2020, original creation date: 2020-03-09 17:48:43
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-09 17:48:43' WHERE \`id\` = 113`,
  )

  // AGE für Gemeinschaftsleistungen rückwirkend für  Januar 2020 , original creation date: 2020-03-11 21:11:03
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-01-11 21:11:03' WHERE \`id\` = 114`,
  )

  // AGE für Gemeinschaftsleistungen Februar 2020 , original creation date: 2020-03-11 21:17:22
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-11 21:17:22' WHERE \`id\` = 115`,
  )

  // AGE für Gemeinschaftsleistungen Februar 2020 , original creation date: 2020-03-11 21:17:26
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-11 21:17:26' WHERE \`id\` = 116`,
  )

  // AGE für Gemeinschaftsleistungen rückwirkend für  Januar, original creation date: 2020-03-18 15:44:07
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-01-18 15:44:07' WHERE \`id\` = 117`,
  )

  // AGE für Gemeinschaftsleistungen Februar 2020 , original creation date: 2020-03-18 15:54:59
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-18 15:54:59' WHERE \`id\` = 118`,
  )

  // AGE für Gemeinschaftsleistungen Februar 2020 , original creation date: 2020-03-18 15:55:32
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-18 15:55:32' WHERE \`id\` = 119`,
  )

  // AGE für Gemeinschaftsleistungen Februar 2020 , original creation date: 2020-03-18 15:56:32
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-18 15:56:32' WHERE \`id\` = 120`,
  )

  // AGE für Gemeinschaftsleistungen Februar 2020 , original creation date: 2020-03-18 15:56:48
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-18 15:56:48' WHERE \`id\` = 121`,
  )

  // AGE für Gemeinschaftsleistungen Februar 2020 , original creation date: 2020-03-18 15:57:14
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-18 15:57:14' WHERE \`id\` = 122`,
  )

  // AGE für Gemeinschaftsleistungen Februar 2020 , original creation date: 2020-03-18 15:58:41
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-18 15:58:41' WHERE \`id\` = 123`,
  )

  // AGE für Gemeinschaftsleistungen Februar 2020 , original creation date: 2020-03-18 15:59:03
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-18 15:59:03' WHERE \`id\` = 124`,
  )

  // AGE für Gemeinschaftsleistungen Februar 2020 , original creation date: 2020-03-18 15:59:26
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-18 15:59:26' WHERE \`id\` = 125`,
  )

  // AGE für Gemeinschaftsleistungen Februar 2020 , original creation date: 2020-03-18 16:00:05
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-18 16:00:05' WHERE \`id\` = 126`,
  )

  // AGE für Gemeinschaftsleistungen Februar 2020 , original creation date: 2020-03-18 16:00:12
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-18 16:00:12' WHERE \`id\` = 127`,
  )

  // Aktives Grundeinkommen, original creation date: 2020-03-23 07:35:35
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-23 07:35:35' WHERE \`id\` = 128`,
  )

  // Aktives Grundeinkommen, original creation date: 2020-03-23 07:35:38
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-23 07:35:38' WHERE \`id\` = 129`,
  )

  // Aktives Grundeinkommen, original creation date: 2020-03-23 07:35:42
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-23 07:35:42' WHERE \`id\` = 130`,
  )

  // Aktives Grundeinkommen Januar , original creation date: 2020-03-24 17:00:05
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-01-24 17:00:05' WHERE \`id\` = 131`,
  )

  // Aktives Grundeinkommen Februar, original creation date: 2020-03-24 17:06:50
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-24 17:06:50' WHERE \`id\` = 132`,
  )

  // Aktives Grundeinkommen Februar, original creation date: 2020-03-24 17:06:54
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-24 17:06:54' WHERE \`id\` = 133`,
  )

  // Aktives Grundeinkommen März, original creation date: 2020-03-24 17:14:21
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-24 17:14:21' WHERE \`id\` = 134`,
  )

  // Aktives Grundeinkommen März, original creation date: 2020-03-24 17:14:27
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-24 17:14:27' WHERE \`id\` = 135`,
  )

  // Aktives Grundeinkommen März, original creation date: 2020-03-24 17:14:28
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-24 17:14:28' WHERE \`id\` = 136`,
  )

  // Aktives Grundeinkommen März, original creation date: 2020-03-24 17:14:30
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-24 17:14:30' WHERE \`id\` = 137`,
  )

  // Aktives Grundeinkommen geschöpft , original creation date: 2020-03-27 09:06:16
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-27 09:06:16' WHERE \`id\` = 138`,
  )

  // Aktives Grundeinkommen für GL Februar, original creation date: 2020-03-27 09:44:27
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-27 09:44:27' WHERE \`id\` = 139`,
  )

  // Aktives Grundeinkommen für GL Februar, original creation date: 2020-03-27 09:44:29
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-27 09:44:29' WHERE \`id\` = 140`,
  )

  // Aktives Grundeinkommen für GL Februar, original creation date: 2020-03-27 09:44:30
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-27 09:44:30' WHERE \`id\` = 141`,
  )

  // Aktives Grundeinkommen für GL Februar, original creation date: 2020-03-27 09:44:35
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-27 09:44:35' WHERE \`id\` = 142`,
  )

  // Aktives Grundeinkommen für GL Februar, original creation date: 2020-03-27 09:44:36
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-27 09:44:36' WHERE \`id\` = 143`,
  )

  // Aktives Grundeinkommen für GL Februar, original creation date: 2020-03-27 09:44:40
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-27 09:44:40' WHERE \`id\` = 144`,
  )

  // Aktives Grundeinkommen für GL Februar, original creation date: 2020-03-27 09:44:42
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-27 09:44:42' WHERE \`id\` = 145`,
  )

  // Aktives Grundeinkommen für GL. März, original creation date: 2020-03-28 09:28:24
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-28 09:28:24' WHERE \`id\` = 146`,
  )

  // Aktives Grundeinkommen für GL. März, original creation date: 2020-03-28 09:34:30
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-28 09:34:30' WHERE \`id\` = 147`,
  )

  // , original creation date: 2020-03-29 17:21:33
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-28 17:21:33' WHERE \`id\` = 148`,
  )

  // , original creation date: 2020-03-29 17:21:35
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-28 17:21:35' WHERE \`id\` = 149`,
  )

  // Aktives Grundeinkommen für GL. Dez, original creation date: 2020-03-30 06:59:55
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2019-12-30 06:59:55' WHERE \`id\` = 150`,
  )

  // Aktives Grundeinkommen für GL. Dez 2019, original creation date: 2020-03-30 07:05:14
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2019-12-30 07:05:14' WHERE \`id\` = 151`,
  )

  // Aktives Grundeinkommen für GL. Jan 2020, original creation date: 2020-03-30 07:09:52
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-01-30 07:09:52' WHERE \`id\` = 152`,
  )

  // Aktives Grundeinkommen für GL. Februar 2020, original creation date: 2020-03-30 07:15:43
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-01 07:15:43' WHERE \`id\` = 153`,
  )

  // Aktives Grundeinkommen für GL., original creation date: 2020-03-30 07:16:33
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-01 07:16:33' WHERE \`id\` = 154`,
  )

  // Aktives Grundeinkommen für GL. März, original creation date: 2020-03-30 07:21:07
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-30 07:21:07' WHERE \`id\` = 155`,
  )

  // Aktives Grundeinkommen für GL. Feb. 2020, original creation date: 2020-03-30 11:47:55
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-01 11:47:55' WHERE \`id\` = 156`,
  )

  // Aktives Grundeinkommen für GL. März, original creation date: 2020-04-01 06:56:20
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-01 06:56:20' WHERE \`id\` = 157`,
  )

  // Aktives Grundeinkommen für GL. März, original creation date: 2020-04-01 06:56:26
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-01 06:56:26' WHERE \`id\` = 158`,
  )

  // Aktives Grundeinkommen für GL. März, original creation date: 2020-04-01 06:56:29
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-01 06:56:29' WHERE \`id\` = 159`,
  )

  // Aktives Grundeinkommen für GL. März, original creation date: 2020-04-01 06:56:31
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-01 06:56:31' WHERE \`id\` = 160`,
  )

  // Aktives Grundeinkommen für GL. März, original creation date: 2020-04-01 06:58:10
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-01 06:58:10' WHERE \`id\` = 161`,
  )

  // Aktives Grundeinkommen für GL. März, original creation date: 2020-04-07 14:09:26
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-07 14:09:26' WHERE \`id\` = 162`,
  )

  // Aktives Grundeinkommen für GL. März, original creation date: 2020-04-07 14:09:28
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-07 14:09:28' WHERE \`id\` = 163`,
  )

  // Aktives Grundeinkommen für GL. März, original creation date: 2020-04-07 14:09:29
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-07 14:09:29' WHERE \`id\` = 164`,
  )

  // Aktives Grundeinkommen für GL. März, original creation date: 2020-04-07 14:09:32
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-07 14:09:32' WHERE \`id\` = 165`,
  )

  // Aktives Grundeinkommen für GL. März, original creation date: 2020-04-08 18:41:17
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-08 18:41:17' WHERE \`id\` = 166`,
  )

  // Aktives Grundeinkommen für GL. März, original creation date: 2020-04-08 18:41:20
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-08 18:41:20' WHERE \`id\` = 167`,
  )

  // Aktives Grundeinkommen für GL. März, original creation date: 2020-04-08 18:41:21
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-08 18:41:21' WHERE \`id\` = 168`,
  )

  // Aktives Grundeinkommen für GL. März, original creation date: 2020-04-08 18:41:23
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-08 18:41:23' WHERE \`id\` = 169`,
  )

  // Aktives Grundeinkommen für GL. März, original creation date: 2020-04-08 18:41:27
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-08 18:41:27' WHERE \`id\` = 170`,
  )

  // Aktives Grundeinkommen für GL. März, original creation date: 2020-04-08 18:58:15
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-08 18:58:15' WHERE \`id\` = 171`,
  )

  // Aktives Grundeinkommen für GL. März, original creation date: 2020-04-15 16:10:54
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-15 16:10:54' WHERE \`id\` = 172`,
  )

  // Aktives Grundeinkommen für GL. März, original creation date: 2020-04-15 16:10:56
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-15 16:10:56' WHERE \`id\` = 173`,
  )

  // Aktives Grundeinkommen für GL. März, original creation date: 2020-04-15 16:10:58
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-15 16:10:58' WHERE \`id\` = 174`,
  )

  // Aktives Grundeinkommen für GL. März, original creation date: 2020-04-15 16:11:01
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-15 16:11:01' WHERE \`id\` = 175`,
  )

  // Aktives Grundeinkommen für GL. März, original creation date: 2020-04-15 16:11:02
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-15 16:11:02' WHERE \`id\` = 176`,
  )

  // Aktives Grundeinkommen für GL. März, original creation date: 2020-04-15 16:11:04
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-15 16:11:04' WHERE \`id\` = 177`,
  )

  // Aktives Grundeinkommen für GL. März, original creation date: 2020-04-15 16:11:07
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-15 16:11:07' WHERE \`id\` = 178`,
  )

  // Aktives Grundeinkommen für GL.März 2020, original creation date: 2020-04-17 16:54:39
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-17 16:54:39' WHERE \`id\` = 179`,
  )

  // Aktives Grundeinkommen für GL.März 2020, original creation date: 2020-04-17 16:54:40
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-17 16:54:40' WHERE \`id\` = 180`,
  )

  // Aktives Grundeinkommen für GL.März 2020, original creation date: 2020-04-17 16:54:42
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-17 16:54:42' WHERE \`id\` = 181`,
  )

  // Aktives Grundeinkommen für GL.März 2020, original creation date: 2020-04-17 16:54:44
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-17 16:54:44' WHERE \`id\` = 182`,
  )

  // Aktives Grundeinkommen geschöpft und gutgeschrieben.
  // Tausend Dank, weil Du bei uns bist und  gemeinsam mit uns das Lebensgeld der Zukunft erschaffst!, original creation date: 2020-04-18 08:58:42
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-18 08:58:42' WHERE \`id\` = 183`,
  )

  // Aktives Grundeinkommen geschöpft und gutgeschrieben.
  // Tausend Dank, weil Du bei uns bist und  gemeinsam mit uns das Lebensgeld der Zukunft erschaffst!, original creation date: 2020-04-18 08:58:44
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-18 08:58:44' WHERE \`id\` = 184`,
  )

  // Aktives Grundeinkommen für GL.März 2020, original creation date: 2020-04-20 17:44:36
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-20 17:44:36' WHERE \`id\` = 185`,
  )

  // Aktives Grundeinkommen für GL.März 2020, original creation date: 2020-04-20 17:44:38
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-20 17:44:38' WHERE \`id\` = 186`,
  )

  // Aktives Grundeinkommen für GL.März 2020, original creation date: 2020-04-20 17:44:40
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-20 17:44:40' WHERE \`id\` = 187`,
  )

  // Aktives Grundeinkommen für GL.März 2020, original creation date: 2020-04-20 17:44:43
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-20 17:44:43' WHERE \`id\` = 188`,
  )

  // Aktives Grundeinkommen für GL März 2020, original creation date: 2020-04-25 06:30:13
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-25 06:30:13' WHERE \`id\` = 189`,
  )

  // Aktives Grundeinkommen für GL März 2020, original creation date: 2020-04-25 06:30:19
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-25 06:30:19' WHERE \`id\` = 190`,
  )

  // Aktives Grundeinkommen für GL März 2020, original creation date: 2020-04-25 06:30:21
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-25 06:30:21' WHERE \`id\` = 191`,
  )

  // Aktives Grundeinkommen für GL März 2020, original creation date: 2020-04-25 06:30:23
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-25 06:30:23' WHERE \`id\` = 192`,
  )

  // Aktives Grundeinkommen für GL März 2020, original creation date: 2020-04-25 06:30:24
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-25 06:30:24' WHERE \`id\` = 193`,
  )

  // Aktives Grundeinkommen für GL März 2020, original creation date: 2020-04-25 06:30:26
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-25 06:30:26' WHERE \`id\` = 194`,
  )

  // Aktives Grundeinkommen für G März 2020, original creation date: 2020-04-25 18:41:55
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-25 18:41:55' WHERE \`id\` = 195`,
  )

  // Aktives Grundeinkommen für G März 2020, original creation date: 2020-04-25 18:42:25
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-25 18:42:25' WHERE \`id\` = 196`,
  )

  // Aktives Grundeinkommen für März 2020, original creation date: 2020-04-25 18:46:01
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-25 18:46:01' WHERE \`id\` = 197`,
  )

  // Aktives Grundeinkommen für März 2020, original creation date: 2020-04-30 06:40:39
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-30 06:40:39' WHERE \`id\` = 198`,
  )

  // Aktives Grundeinkommen für März 2020, original creation date: 2020-04-30 06:40:41
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-30 06:40:41' WHERE \`id\` = 199`,
  )

  // Aktives Grundeinkommen für März 2020, original creation date: 2020-04-30 06:40:42
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-30 06:40:42' WHERE \`id\` = 200`,
  )

  // Aktives Grundeinkommen für März 2020, original creation date: 2020-04-30 06:40:45
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-30 06:40:45' WHERE \`id\` = 201`,
  )

  // Aktives Grundeinkommen für März 2020, original creation date: 2020-04-30 06:40:46
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-30 06:40:46' WHERE \`id\` = 202`,
  )

  // Aktives Grundeinkommen für März 2020, original creation date: 2020-04-30 06:40:50
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-30 06:40:50' WHERE \`id\` = 203`,
  )

  // Aktives Grundeinkommen für März 2020, original creation date: 2020-05-02 08:25:27
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-02 08:25:27' WHERE \`id\` = 204`,
  )

  // Aktives Grundeinkommen für März 2020, original creation date: 2020-05-02 08:25:29
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-02 08:25:29' WHERE \`id\` = 205`,
  )

  // Aktives Grundeinkommen für März 2020, original creation date: 2020-05-02 08:25:32
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-02 08:25:32' WHERE \`id\` = 206`,
  )

  // Aktives Grundeinkommen für März 2020, original creation date: 2020-05-02 08:28:14
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-02 08:28:14' WHERE \`id\` = 207`,
  )

  // Aktives Grundeinkommen für April 2020, original creation date: 2020-05-02 08:43:49
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-04-02 08:43:49' WHERE \`id\` = 208`,
  )

  // Aktives Grundeinkommen für April 2020, original creation date: 2020-05-02 08:43:51
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-04-02 08:43:51' WHERE \`id\` = 209`,
  )

  // Aktives Grundeinkommen für April 2020, original creation date: 2020-05-02 08:43:54
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-04-02 08:43:54' WHERE \`id\` = 210`,
  )

  // Aktives Grundeinkommen für April 2020, original creation date: 2020-05-02 08:43:56
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-04-02 08:43:56' WHERE \`id\` = 211`,
  )

  // Aktives Grundeinkommen für April 2020, original creation date: 2020-05-02 08:43:57
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-04-02 08:43:57' WHERE \`id\` = 212`,
  )

  // Aktives Grundeinkommen für April 2020, original creation date: 2020-05-02 08:43:59
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-04-02 08:43:59' WHERE \`id\` = 213`,
  )

  // Aktives Grundeinkommen für April 2020, original creation date: 2020-05-02 08:44:01
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-04-02 08:44:01' WHERE \`id\` = 214`,
  )

  // Aktives Grundeinkommen für April 2020, original creation date: 2020-05-02 08:44:02
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-04-02 08:44:02' WHERE \`id\` = 215`,
  )

  // Aktives Grundeinkommen für April 2020, original creation date: 2020-05-02 08:44:05
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-04-02 08:44:05' WHERE \`id\` = 216`,
  )

  // Aktives Grundeinkommen für April 2020, original creation date: 2020-05-02 08:44:10
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-04-02 08:44:10' WHERE \`id\` = 217`,
  )

  // Aktives Grundeinkommen für April 2020, original creation date: 2020-05-02 08:44:12
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-04-02 08:44:12' WHERE \`id\` = 218`,
  )

  // Aktives Grundeinkommen für April 2020, original creation date: 2020-05-02 08:44:14
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-04-02 08:44:14' WHERE \`id\` = 219`,
  )

  // Aktives Grundeinkommen für April 2020, original creation date: 2020-05-02 08:44:17
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-04-02 08:44:17' WHERE \`id\` = 220`,
  )

  // Aktives Grundeinkommen für April 2020, original creation date: 2020-05-03 09:00:04
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-04-03 09:00:04' WHERE \`id\` = 221`,
  )

  // Aktives Grundeinkommen für April 2020, original creation date: 2020-05-03 09:00:07
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-04-03 09:00:07' WHERE \`id\` = 222`,
  )
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // reverse creation date changes

  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2019-12-17 13:06:13' WHERE \`id\` = 1`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2019-12-17 13:06:16' WHERE \`id\` = 2`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2019-12-17 13:06:19' WHERE \`id\` = 3`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2019-12-17 13:06:21' WHERE \`id\` = 4`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2019-12-17 13:07:01' WHERE \`id\` = 5`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2019-12-19 17:35:16' WHERE \`id\` = 6`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-01-08 10:34:40' WHERE \`id\` = 7`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-01-08 11:02:41' WHERE \`id\` = 8`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-01-08 11:06:42' WHERE \`id\` = 9`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-01-08 11:16:11' WHERE \`id\` = 10`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-01-08 11:16:15' WHERE \`id\` = 11`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-01-08 13:24:29' WHERE \`id\` = 12`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-01-09 12:02:48' WHERE \`id\` = 13`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-01-09 12:02:52' WHERE \`id\` = 14`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-01-09 12:02:54' WHERE \`id\` = 15`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-01-09 12:09:08' WHERE \`id\` = 16`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-01-11 11:10:55' WHERE \`id\` = 17`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-01-11 11:11:24' WHERE \`id\` = 18`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-01-11 11:12:09' WHERE \`id\` = 19`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-01-11 11:31:20' WHERE \`id\` = 20`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-01-11 11:37:13' WHERE \`id\` = 21`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-01-11 11:37:42' WHERE \`id\` = 22`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-01-11 19:01:06' WHERE \`id\` = 23`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-01-13 16:27:07' WHERE \`id\` = 24`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-01-13 16:28:05' WHERE \`id\` = 25`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-01-13 16:28:57' WHERE \`id\` = 26`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-01-13 16:29:45' WHERE \`id\` = 27`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-01-17 13:47:28' WHERE \`id\` = 28`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-01-17 13:48:52' WHERE \`id\` = 29`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-01-17 13:49:21' WHERE \`id\` = 30`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-01-23 13:08:44' WHERE \`id\` = 31`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-01-27 08:12:16' WHERE \`id\` = 32`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-01-30 14:49:58' WHERE \`id\` = 33`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-01-30 14:50:35' WHERE \`id\` = 34`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-01-30 14:50:55' WHERE \`id\` = 35`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-01-30 14:52:03' WHERE \`id\` = 36`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-01-30 14:52:33' WHERE \`id\` = 37`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-01-30 14:52:53' WHERE \`id\` = 38`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-01-30 14:53:45' WHERE \`id\` = 39`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-01-30 14:54:13' WHERE \`id\` = 40`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-01-30 14:54:50' WHERE \`id\` = 41`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-01-30 15:03:26' WHERE \`id\` = 42`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-01-30 15:10:39' WHERE \`id\` = 43`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-01-30 15:13:10' WHERE \`id\` = 44`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-01-30 15:26:45' WHERE \`id\` = 45`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-19 08:54:31' WHERE \`id\` = 46`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-19 08:55:30' WHERE \`id\` = 47`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-19 08:55:33' WHERE \`id\` = 48`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-19 08:55:36' WHERE \`id\` = 49`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-19 08:55:39' WHERE \`id\` = 50`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-19 08:55:43' WHERE \`id\` = 51`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-19 08:55:46' WHERE \`id\` = 52`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-19 08:55:48' WHERE \`id\` = 53`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-19 08:55:50' WHERE \`id\` = 54`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-19 08:55:52' WHERE \`id\` = 55`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-19 08:55:54' WHERE \`id\` = 56`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-19 08:55:56' WHERE \`id\` = 57`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-19 08:55:59' WHERE \`id\` = 58`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-19 08:56:02' WHERE \`id\` = 59`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-19 08:56:05' WHERE \`id\` = 60`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-19 08:56:07' WHERE \`id\` = 61`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-19 08:56:10' WHERE \`id\` = 62`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-19 08:56:12' WHERE \`id\` = 63`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-19 08:56:14' WHERE \`id\` = 64`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-19 08:56:21' WHERE \`id\` = 65`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-19 08:56:24' WHERE \`id\` = 66`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-19 08:56:26' WHERE \`id\` = 67`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-19 08:56:28' WHERE \`id\` = 68`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-19 08:56:31' WHERE \`id\` = 69`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-20 06:40:36' WHERE \`id\` = 70`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-20 06:43:41' WHERE \`id\` = 71`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-20 06:43:43' WHERE \`id\` = 72`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-20 06:43:45' WHERE \`id\` = 73`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-20 06:43:47' WHERE \`id\` = 74`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-20 07:09:05' WHERE \`id\` = 75`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-20 08:03:31' WHERE \`id\` = 76`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-29 16:17:24' WHERE \`id\` = 77`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-29 16:17:35' WHERE \`id\` = 78`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-29 16:17:42' WHERE \`id\` = 79`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-29 16:29:47' WHERE \`id\` = 80`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-29 16:29:48' WHERE \`id\` = 81`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-02-29 16:29:55' WHERE \`id\` = 82`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-04 09:08:54' WHERE \`id\` = 83`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-07 07:59:42' WHERE \`id\` = 84`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-07 07:59:51' WHERE \`id\` = 85`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-07 07:59:54' WHERE \`id\` = 86`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-07 07:59:57' WHERE \`id\` = 87`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-07 08:15:48' WHERE \`id\` = 88`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-07 08:15:53' WHERE \`id\` = 89`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-07 08:15:56' WHERE \`id\` = 90`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-07 08:15:59' WHERE \`id\` = 91`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-07 08:16:01' WHERE \`id\` = 92`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-07 08:16:05' WHERE \`id\` = 93`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-07 08:16:07' WHERE \`id\` = 94`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-07 08:16:10' WHERE \`id\` = 95`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-07 08:17:00' WHERE \`id\` = 96`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-07 08:17:03' WHERE \`id\` = 97`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-07 08:17:05' WHERE \`id\` = 98`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-07 08:17:07' WHERE \`id\` = 99`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-07 08:17:09' WHERE \`id\` = 100`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-07 08:17:11' WHERE \`id\` = 101`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-07 08:17:13' WHERE \`id\` = 102`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-07 08:17:21' WHERE \`id\` = 103`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-07 08:17:25' WHERE \`id\` = 104`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-07 08:17:28' WHERE \`id\` = 105`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-07 08:19:15' WHERE \`id\` = 106`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-08 18:00:20' WHERE \`id\` = 107`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-09 11:43:30' WHERE \`id\` = 108`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-09 17:48:34' WHERE \`id\` = 109`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-09 17:48:36' WHERE \`id\` = 110`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-09 17:48:38' WHERE \`id\` = 111`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-09 17:48:40' WHERE \`id\` = 112`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-09 17:48:43' WHERE \`id\` = 113`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-11 21:11:03' WHERE \`id\` = 114`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-11 21:17:22' WHERE \`id\` = 115`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-11 21:17:26' WHERE \`id\` = 116`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-18 15:44:07' WHERE \`id\` = 117`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-18 15:54:59' WHERE \`id\` = 118`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-18 15:55:32' WHERE \`id\` = 119`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-18 15:56:32' WHERE \`id\` = 120`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-18 15:56:48' WHERE \`id\` = 121`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-18 15:57:14' WHERE \`id\` = 122`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-18 15:58:41' WHERE \`id\` = 123`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-18 15:59:03' WHERE \`id\` = 124`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-18 15:59:26' WHERE \`id\` = 125`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-18 16:00:05' WHERE \`id\` = 126`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-18 16:00:12' WHERE \`id\` = 127`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-23 07:35:35' WHERE \`id\` = 128`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-23 07:35:38' WHERE \`id\` = 129`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-23 07:35:42' WHERE \`id\` = 130`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-24 17:00:05' WHERE \`id\` = 131`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-24 17:06:50' WHERE \`id\` = 132`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-24 17:06:54' WHERE \`id\` = 133`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-24 17:14:21' WHERE \`id\` = 134`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-24 17:14:27' WHERE \`id\` = 135`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-24 17:14:28' WHERE \`id\` = 136`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-24 17:14:30' WHERE \`id\` = 137`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-27 09:06:16' WHERE \`id\` = 138`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-27 09:44:27' WHERE \`id\` = 139`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-27 09:44:29' WHERE \`id\` = 140`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-27 09:44:30' WHERE \`id\` = 141`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-27 09:44:35' WHERE \`id\` = 142`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-27 09:44:36' WHERE \`id\` = 143`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-27 09:44:40' WHERE \`id\` = 144`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-27 09:44:42' WHERE \`id\` = 145`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-28 09:28:24' WHERE \`id\` = 146`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-28 09:34:30' WHERE \`id\` = 147`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-29 17:21:33' WHERE \`id\` = 148`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-29 17:21:35' WHERE \`id\` = 149`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-30 06:59:55' WHERE \`id\` = 150`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-30 07:05:14' WHERE \`id\` = 151`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-30 07:09:52' WHERE \`id\` = 152`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-30 07:15:43' WHERE \`id\` = 153`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-30 07:16:33' WHERE \`id\` = 154`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-30 07:21:07' WHERE \`id\` = 155`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-03-30 11:47:55' WHERE \`id\` = 156`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-04-01 06:56:20' WHERE \`id\` = 157`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-04-01 06:56:26' WHERE \`id\` = 158`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-04-01 06:56:29' WHERE \`id\` = 159`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-04-01 06:56:31' WHERE \`id\` = 160`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-04-01 06:58:10' WHERE \`id\` = 161`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-04-07 14:09:26' WHERE \`id\` = 162`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-04-07 14:09:28' WHERE \`id\` = 163`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-04-07 14:09:29' WHERE \`id\` = 164`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-04-07 14:09:32' WHERE \`id\` = 165`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-04-08 18:41:17' WHERE \`id\` = 166`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-04-08 18:41:20' WHERE \`id\` = 167`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-04-08 18:41:21' WHERE \`id\` = 168`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-04-08 18:41:23' WHERE \`id\` = 169`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-04-08 18:41:27' WHERE \`id\` = 170`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-04-08 18:58:15' WHERE \`id\` = 171`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-04-15 16:10:54' WHERE \`id\` = 172`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-04-15 16:10:56' WHERE \`id\` = 173`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-04-15 16:10:58' WHERE \`id\` = 174`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-04-15 16:11:01' WHERE \`id\` = 175`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-04-15 16:11:02' WHERE \`id\` = 176`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-04-15 16:11:04' WHERE \`id\` = 177`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-04-15 16:11:07' WHERE \`id\` = 178`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-04-17 16:54:39' WHERE \`id\` = 179`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-04-17 16:54:40' WHERE \`id\` = 180`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-04-17 16:54:42' WHERE \`id\` = 181`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-04-17 16:54:44' WHERE \`id\` = 182`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-04-18 08:58:42' WHERE \`id\` = 183`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-04-18 08:58:44' WHERE \`id\` = 184`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-04-20 17:44:36' WHERE \`id\` = 185`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-04-20 17:44:38' WHERE \`id\` = 186`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-04-20 17:44:40' WHERE \`id\` = 187`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-04-20 17:44:43' WHERE \`id\` = 188`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-04-25 06:30:13' WHERE \`id\` = 189`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-04-25 06:30:19' WHERE \`id\` = 190`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-04-25 06:30:21' WHERE \`id\` = 191`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-04-25 06:30:23' WHERE \`id\` = 192`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-04-25 06:30:24' WHERE \`id\` = 193`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-04-25 06:30:26' WHERE \`id\` = 194`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-04-25 18:41:55' WHERE \`id\` = 195`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-04-25 18:42:25' WHERE \`id\` = 196`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-04-25 18:46:01' WHERE \`id\` = 197`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-04-30 06:40:39' WHERE \`id\` = 198`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-04-30 06:40:41' WHERE \`id\` = 199`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-04-30 06:40:42' WHERE \`id\` = 200`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-04-30 06:40:45' WHERE \`id\` = 201`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-04-30 06:40:46' WHERE \`id\` = 202`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-04-30 06:40:50' WHERE \`id\` = 203`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-05-02 08:25:27' WHERE \`id\` = 204`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-05-02 08:25:29' WHERE \`id\` = 205`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-05-02 08:25:32' WHERE \`id\` = 206`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-05-02 08:28:14' WHERE \`id\` = 207`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-05-02 08:43:49' WHERE \`id\` = 208`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-05-02 08:43:51' WHERE \`id\` = 209`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-05-02 08:43:54' WHERE \`id\` = 210`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-05-02 08:43:56' WHERE \`id\` = 211`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-05-02 08:43:57' WHERE \`id\` = 212`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-05-02 08:43:59' WHERE \`id\` = 213`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-05-02 08:44:01' WHERE \`id\` = 214`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-05-02 08:44:02' WHERE \`id\` = 215`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-05-02 08:44:05' WHERE \`id\` = 216`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-05-02 08:44:10' WHERE \`id\` = 217`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-05-02 08:44:12' WHERE \`id\` = 218`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-05-02 08:44:14' WHERE \`id\` = 219`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-05-02 08:44:17' WHERE \`id\` = 220`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-05-03 09:00:04' WHERE \`id\` = 221`,
  )
  await queryFn(
    `UPDATE \`transactions\` SET creation_date = '2020-05-03 09:00:07' WHERE \`id\` = 222`,
  )

  // remove added transaction
  await queryFn(
    `DELETE FROM \`transactions\` 
     WHERE \`user_id\` = 275 AND \`balance\` IN (2000, 3000) AND \`amount\` = 1000`,
  )

  // rewind transaction to split
  await queryFn(
    `UPDATE \`transactions\` set \`amount\` = 3000, \`memo\` = 'Aktives Grundeinkommen für GL. Dez, Jan, Feb' 
     WHERE \`id\` = 150`,
  )

  await queryFn(`UPDATE \`transactions\` set \`previous\` = 150 WHERE \`id\` = 278`)
}
