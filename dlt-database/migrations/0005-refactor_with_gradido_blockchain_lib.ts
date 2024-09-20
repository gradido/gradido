export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    `ALTER TABLE \`communities\` CHANGE COLUMN \`root_privkey\` \`root_encrypted_privkey\` binary(80) NULL DEFAULT NULL;`,
  )
  await queryFn(
    `ALTER TABLE \`transactions\` MODIFY COLUMN \`account_balance_on_confirmation\` int NULL DEFAULT 0;`,
  )
  await queryFn(
    `ALTER TABLE \`transactions\` MODIFY COLUMN \`account_balance_on_creation\` int NULL DEFAULT 0;`,
  )
  await queryFn(`ALTER TABLE \`transactions\` MODIFY COLUMN \`amount\` int NULL DEFAULT 0;`)
  await queryFn(`DROP TABLE \`backend_transactions\`;`)
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    `ALTER TABLE \`communities\` CHANGE COLUMN \`root_encrypted_privkey\` \`root_privkey\` binary(64) NULL DEFAULT NULL;`,
  )
  await queryFn(
    `ALTER TABLE \`transactions\` MODIFY COLUMN \`account_balance_on_confirmation\` decimal(40, 20) NULL DEFAULT 0.00000000000000000000;`,
  )
  await queryFn(
    `ALTER TABLE \`transactions\` MODIFY COLUMN \`account_balance_on_creation\` decimal(40, 20) NULL DEFAULT 0.00000000000000000000;`,
  )
  await queryFn(
    `ALTER TABLE \`transactions\` MODIFY COLUMN \`amount\` decimal(40, 20) NULL DEFAULT NULL;`,
  )
}
