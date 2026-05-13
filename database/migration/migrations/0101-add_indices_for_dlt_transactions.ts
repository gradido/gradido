export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`CREATE INDEX idx_dlt_user_id ON dlt_transactions (user_id);`)
  await queryFn(`CREATE INDEX idx_dlt_transaction_id ON dlt_transactions (transaction_id);`)
  await queryFn(
    `CREATE INDEX idx_dlt_transaction_link_id ON dlt_transactions (transaction_link_id);`,
  )
  await queryFn(`CREATE INDEX idx_users_created_id_uuid ON users (created_at, id, community_uuid);`)
  await queryFn(`CREATE INDEX idx_contributions_feed ON contributions (
    contribution_status,
    contribution_link_id,
    confirmed_at,
    transaction_id
  );`)
  await queryFn(`CREATE INDEX idx_transactions_balance_date_id ON transactions (balance_date, id);`)
  await queryFn(`CREATE INDEX idx_transaction_link_id ON transactions (transaction_link_id);`)
  await queryFn(`CREATE INDEX idx_linked_user_id ON transactions (linked_user_id);`)
  await queryFn(`CREATE INDEX idx_userId ON transaction_links (userId);`)
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`DROP INDEX idx_dlt_user_id ON dlt_transactions;`)
  await queryFn(`DROP INDEX idx_dlt_transaction_id ON dlt_transactions;`)
  await queryFn(`DROP INDEX idx_dlt_transaction_link_id ON dlt_transactions;`)
  await queryFn(`DROP INDEX idx_users_created_id_uuid ON users;`)
  await queryFn(`DROP INDEX idx_contributions_feed ON contributions;`)
  await queryFn(`DROP INDEX idx_transactions_balance_date_id ON transactions;`)
  await queryFn(`DROP INDEX idx_transaction_link_id ON transactions;`)
  await queryFn(`DROP INDEX idx_linked_user_id ON transactions;`)
  await queryFn(`DROP INDEX idx_userId ON transaction_links;`)
}
