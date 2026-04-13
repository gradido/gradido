export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    `ALTER TABLE transactions ADD decay_calculation_type int DEFAULT 0 after decay_start;`,
  )
  await queryFn(
    `ALTER TABLE pending_transactions ADD decay_calculation_type int DEFAULT 0 after decay_start;`,
  )
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`ALTER TABLE transactions DROP decay_calculation_type;`)
  await queryFn(`ALTER TABLE pending_transactions DROP decay_calculation_type;`)
}
