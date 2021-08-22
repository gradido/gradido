export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // write upgrade logic as parameter of queryFn
  await queryFn(`
    CREATE TABLE TEST (ID INTEGER NULL, NAME VARCHAR(20) NULL);
  `)
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // write downgrade logic as parameter of queryFn
  await queryFn(`
    DROP TABLE TEST;
  `)
}
