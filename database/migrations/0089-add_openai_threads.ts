/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`
    CREATE TABLE openai_threads (
      id VARCHAR(128) PRIMARY KEY,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      user_id int(10) unsigned NOT NULL
    ) ENGINE = InnoDB;
  `)
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`DROP TABLE openai_threads`)
}
