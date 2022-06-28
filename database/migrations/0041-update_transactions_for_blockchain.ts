/* MIGRATION for updating transactions from the past to follow the blockchain rules*/
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
    // split creation transaction with 3000 GDD created in one transaction what isn't allowed
    const transactionDivData = [
        {date: new Date('2019-12-01T01:00:00'), memo: 'Aktives Grundeinkommen für GL. Dez'},
        {date: new Date('2019-01-01T01:00:00'), memo: 'Aktives Grundeinkommen für GL. Jan'},
        {date: new Date('2019-02-01T01:00:00'), memo: 'Aktives Grundeinkommen für GL. Feb'}
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
    
    transactionDivData.forEach(({date:Date, memo:string}, index)=> {
        if(!index) {
            queryFn(`
            INSERT INTO transactions(
                user_id, type_id, amount, balance, 
                balance_date, decay, decay_start, 
                memo, creation_date, linked_user_id
            ) VALUES(
                275, 1, 1000, ?,
                ?
            )`, [1000 * (index + 1), date])
            
        } else {
            //queryFn('INSERT INTO transactions(user_id, previous, type_id, amount, balance, balance_date, decay, decay_start, memo, creation_date, linked_user_id)')
        }
        
    })
    /*
    Profiler splitTransactionTime;
    Poco::Data::Statement insertTransactions(dbSession);
    std::string memo;
    Poco::DateTime received(2020, 3, 30, 8, 59, 55);
    insertTransactions << "INSERT INTO " << mTempTransactionsTableName
        << "(transaction_type_id, memo, received) VALUES(1, ?, ?)",
        use(memo), use(received);

    Poco::Data::Statement insertCreationTransactions(dbSession);
    int amount = 10000000;
    Poco::DateTime targetDate(2019, 12, 1, 1, 0, 0);
    insertCreationTransactions << "INSERT INTO " << mTempCreationTableName
        << "(transaction_id, state_user_id, amount, target_date) VALUES(LAST_INSERT_ID(), 275, ?, ?)",
        use(amount), use(targetDate);

    for (auto it = transactionDivData.begin(); it != transactionDivData.end(); it++) {
        targetDate = it->first;
        memo = it->second;
        insertTransactions.execute();
        insertCreationTransactions.execute();
    }
    Poco::Data::Statement removeInvalidTransaction(dbSession);
    removeInvalidTransaction << "delete from " << mTempCreationTableName << " where id = 150", now;
    removeInvalidTransaction.reset(dbSession);
    removeInvalidTransaction << "delete from " << mTempTransactionsTableName << " where id = 224", now;
    speedLog.information("time for split transaction: %s", splitTransactionTime.string());
    */
    //await queryFn('DROP TABLE `user_setting`;')
  }
  
  export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
    
  }
  