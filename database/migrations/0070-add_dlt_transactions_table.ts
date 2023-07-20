/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`
    CREATE TABLE dlt_transactions (
      id int unsigned NOT NULL AUTO_INCREMENT,
      transactions_id int(10) unsigned NOT NULL,
      message_id varchar(40) NOT NULL,
      verified tinyint(4) NOT NULL DEFAULT 0,
      community_balance decimal(40,20) DEFAULT NULL NULL,
      community_balance_date datetime(3) DEFAULT NULL NULL,
      community_balance_decay decimal(40,20) DEFAULT NULL NULL,
      community_balance_decay_start datetime(3) DEFAULT NULL NULL,
      created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      verified_at datetime(3),
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`)
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`DROP TABLE dlt_transactions;`)
}
