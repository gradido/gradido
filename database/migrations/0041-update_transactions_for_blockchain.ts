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

  queryFn(`UPDATE 'transactions' set amount = 1000, memo = ? WHERE id = 150`, [transactionMemos[0]])
  queryFn(
    `INSERT INTO 'transactions'(
            user_id, previous, type_id, amount, balance, balance_date, memo, creation_date
          ) VALUES(
            275, 150, 1, 1000, 2000, ?, ?, ?
          )`,
    [creationDate, transactionMemos[1], creationDate],
  )
  queryFn(
    `INSERT INTO 'transactions'(
            user_id, previous, type_id, amount, balance, balance_date, memo, creation_date
          ) VALUES(
            275, LAST_INSERT_ID(), 1, 1000, 3000, ?, ?, ?
          )`,
    [creationDate, transactionMemos[2], creationDate],
  )

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
  // remove added transaction
  queryFn(
    "DELETE FROM 'transactions' WHERE 'user_id' = 275 AND 'balance' IN(2000, 3000) AND 'amount' = 1000",
  )
  // rewind transaction to split
  queryFn(
    `UPDATE 'transactions' set amount = 3000, memo = 'Aktives Grundeinkommen für GL. Dez, Jan, Feb' WHERE id = 150`,
  )
}
