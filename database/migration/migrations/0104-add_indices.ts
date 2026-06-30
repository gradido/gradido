export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`CREATE INDEX idx_contributions_transaction_id ON contributions(transaction_id);`)
  await queryFn(`CREATE INDEX idx_user_id_valid_until ON transaction_links(userId, validUntil, id); `)
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`DROP INDEX idx_contributions_transaction_id ON contributions;`)
  await queryFn(`DROP INDEX idx_user_id_valid_until ON transaction_links; `)
}
