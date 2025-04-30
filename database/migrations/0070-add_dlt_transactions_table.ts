export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`
    CREATE TABLE dlt_transactions (
      id int unsigned NOT NULL AUTO_INCREMENT,
      transactions_id int(10) unsigned NOT NULL,
      message_id varchar(64) NULL DEFAULT NULL,
      verified tinyint(4) NOT NULL DEFAULT 0,
      created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      verified_at datetime(3),
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`)
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`DROP TABLE dlt_transactions;`)
}
