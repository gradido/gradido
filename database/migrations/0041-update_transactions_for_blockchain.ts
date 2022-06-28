/* MIGRATION for updating transactions from the past to follow the blockchain rules */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  interface TransactionDivData {
    date: Date
    memo: string
  }
  // split creation transaction with 3000 GDD created in one transaction what isn't allowed
  const transactionDivData: TransactionDivData[] = [
    { date: new Date('2019-12-01T01:00:00'), memo: 'Aktives Grundeinkommen für GL. Dez' },
    { date: new Date('2019-01-01T01:00:00'), memo: 'Aktives Grundeinkommen für GL. Jan' },
    { date: new Date('2019-02-01T01:00:00'), memo: 'Aktives Grundeinkommen für GL. Feb' },
  ]
  /*
    | id                    | int(10) unsigned | NO   | PRI | NULL                | auto_increment |
    | user_id               | int(10)          | YES  |     | NULL                |                |
    | previous              | int(10) unsigned | YES  | UNI | NULL                |                |
    | type_id               | int(10)          | YES  |     | NULL                |                |
    | amount                | decimal(40,20)   | YES  |     | NULL                |                |
    | balance               | decimal(40,20)   | YES  |     | NULL                |                |
    | balance_date          | datetime         | NO   |     | current_timestamp() |                |
    | decay                 | decimal(40,20)   | YES  |     | NULL                |                |
    | decay_start           | datetime         | YES  |     | NULL                |                |
    | memo                  | varchar(255)     | NO   |     | NULL                |                |
    | creation_date         | datetime         | YES  |     | NULL                |                |
    | linked_user_id        | int(10) unsigned | YES  |     | NULL                |                |
    | linked_transaction_id | int(10)          | YES  |     | NULL                |                |
    | transaction_link_id   | int(10) unsigned | YES  |     | NULL                |                |

    */

  transactionDivData.forEach((transactionDivData, index) => {
    let sqlQuery = "INSERT INTO 'transactions'(user_id,"
    let sqlValues = 'VALUES(275,'
    if (index) {
      sqlQuery += 'previous,'
      sqlValues += 'LAST_INSERT_ID()'
    }
    sqlQuery += `type_id, amount, balance, 
                      balance_date,  
                      memo, creation_date`
    sqlValues += '1, 1000, ?, ?, ?, ?'

    sqlQuery += ')'
    sqlValues += ')'
    queryFn(sqlQuery + sqlValues, [
      1000 * (index + 1),
      transactionDivData.date,
      transactionDivData.memo,
      transactionDivData.date,
    ])
  })
  // remove original transaction
  queryFn("DELETE FROM 'transactions' where id = 150")

  // update previous field of first transaction after splitted transaction
  queryFn("UPDATE 'transactions' SET 'previous' = LAST_INSERT_ID() WHERE 'previous' = 150")

  // ----------------------------------------------------------------------------------------------
  // update creation_date for transactions with creation_date == balance_date
  // !cannot made be undone easily!

  // update entries from which memo contain month name (most cases)
  interface ReplaceSet {
    monthName: string
    monthValue: number
    yearValue: number
  }
  const replaceSets: ReplaceSet[] = [
    { monthName: 'Dez', monthValue: 12, yearValue: 2019 },
    { monthName: 'Jan', monthValue: 1, yearValue: 2020 },
    { monthName: 'Feb', monthValue: 2, yearValue: 2020 },
    { monthName: 'M_rz', monthValue: 3, yearValue: 2020 },
    { monthName: 'April', monthValue: 4, yearValue: 2020 },
  ]
  replaceSets.forEach((replaceSet) => {
    let sqlQuery = `update 'transactions' 
      SET 'creation_date' = DATE_FORMAT('creation_date', CONCAT(?, '-', ?, '-', `
    if (replaceSet.monthName === 'Feb') {
      sqlQuery += "IF(DATE_FORMAT(creation_date, '%d') <= 28, '%d', 28)"
    } else {
      sqlQuery += "'%d'"
    }
    sqlQuery += `, ' %H:%i:%s'))
      WHERE balance_date = creation_date
      AND type_id = 1
      AND memo LIKE '%?%'`

    queryFn(sqlQuery, [replaceSet.yearValue, replaceSet.monthValue, replaceSet.monthName])
  })

  // update entries without month name in memo, simply move creation_date 1 month before balance_date
  queryFn(`UPDATE 'transactions' 
           set creation_date = CAST(DATE_FORMAT(creation_date, CONCAT(
           IF(DATE_FORMAT(creation_date, '%m') = 1, DATE_FORMAT(creation_date, '%Y') - 1, '%Y'),
           '-',
           IF(DATE_FORMAT(creation_date, '%m') = 1, 12, DATE_FORMAT(creation_date, '%m') - 1),
           '-',
           IF(DATE_FORMAT(creation_date, '%m') = 3, IF(DATE_FORMAT(creation_date, '%d') <= 28, '%d', 28), '%d'),
           ' %H:%i:%s')) AS DATETIME)
           WHERE balance_date = creation_date 
  `)
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // remove in upgrade added transactions
  const creationDates: Date[] = [
    new Date('2019-12-01T01:00:00'),
    new Date('2019-01-01T01:00:00'),
    new Date('2019-02-01T01:00:00'),
  ]
  queryFn(
    "DELETE FROM 'transactions' WHERE 'user_id' = 275 AND 'creation_date' IN(?,?,?)",
    creationDates,
  )
  // put back removed transaction
  queryFn(
    `INSERT INTO 'transactions'(
      id, user_id, 
      type_id, amount, 
      balance, balance_date, 
      memo, creation_date
    ) VALUES(
      150, 275,
       1, 3000,
       3000, '2020-03-30 06:59:55',
       'Aktives Grundeinkommen für GL. Dez, Jan, Feb', '2020-03-30 06:59:55'
    )`,
  )

  // restore previous field of first transaction after splitted transaction
  queryFn("UPDATE 'transactions' SET 'previous' = 150 WHERE 'id' = 278")
}
