export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`
    ALTER TABLE \`transactions\` 
      RENAME COLUMN \`paring_transaction_id\` TO \`pairing_transaction_id\`
    ;
  `)
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`
    ALTER TABLE \`transactions\` 
      RENAME COLUMN \`pairing_transaction_id\` TO \`paring_transaction_id\`
    ;
  `)
}
