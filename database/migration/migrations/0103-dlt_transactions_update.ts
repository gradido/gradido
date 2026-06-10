export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    `ALTER TABLE dlt_transactions CHANGE message_id hiero_transaction_id VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL; `,
  )
  await queryFn(`ALTER TABLE dlt_transactions ADD UNIQUE(hiero_transaction_id); `)
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`ALTER TABLE dlt_transactions DROP INDEX hiero_transaction_id; `)
  await queryFn(
    `ALTER TABLE dlt_transactions CHANGE hiero_transaction_id message_id VARCHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL; `,
  )
}
