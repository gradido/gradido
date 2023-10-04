/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // write upgrade logic as parameter of queryFn
  await queryFn(
    `ALTER TABLE \`communities\` MODIFY COLUMN \`root_privkey\` binary(64) NULL DEFAULT NULL;`,
  )
  await queryFn(
    `ALTER TABLE \`communities\` MODIFY COLUMN \`root_pubkey\` binary(32) NULL DEFAULT NULL;`,
  )
  await queryFn(
    `ALTER TABLE \`communities\` MODIFY COLUMN \`root_chaincode\` binary(32) NULL DEFAULT NULL;`,
  )
  await queryFn(
    `ALTER TABLE \`communities\` MODIFY COLUMN \`confirmed_at\` datetime NULL DEFAULT NULL;`,
  )
  await queryFn(`ALTER TABLE \`users\` MODIFY COLUMN \`confirmed_at\` datetime NULL DEFAULT NULL;`)
  await queryFn(
    `ALTER TABLE \`accounts\` MODIFY COLUMN \`confirmed_at\` datetime NULL DEFAULT NULL;`,
  )
  await queryFn(
    `ALTER TABLE \`accounts\` MODIFY COLUMN \`balance_date\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP;`,
  )
  await queryFn(
    `ALTER TABLE \`accounts_communities\` MODIFY COLUMN \`valid_from\` datetime NOT NULL;`,
  )
  await queryFn(
    `ALTER TABLE \`accounts_communities\` MODIFY COLUMN \`valid_to\` datetime NULL DEFAULT NULL;`,
  )
  await queryFn(
    `ALTER TABLE \`confirmed_transactions\` MODIFY COLUMN \`confirmed_at\` datetime NOT NULL;`,
  )
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    `ALTER TABLE \`communities\` MODIFY COLUMN \`root_privkey\` binary(32) DEFAULT NULL;`,
  )
  await queryFn(`ALTER TABLE \`communities\` MODIFY COLUMN \`root_pubkey\` binary(32) NOT NULL;`)
  await queryFn(
    `ALTER TABLE \`communities\` MODIFY COLUMN \`root_chaincode\` binary(32) DEFAULT NULL;`,
  )
  await queryFn(
    `ALTER TABLE \`communities\` MODIFY COLUMN \`confirmed_at\` datetime(3) DEFAULT NULL;`,
  )
  await queryFn(`ALTER TABLE \`users\` MODIFY COLUMN \`confirmed_at\` datetime(3) DEFAULT NULL;`)
  await queryFn(`ALTER TABLE \`accounts\` MODIFY COLUMN \`confirmed_at\` datetime(3) DEFAULT NULL;`)
  await queryFn(
    `ALTER TABLE \`accounts\` MODIFY COLUMN \`balance_date\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);`,
  )
  await queryFn(
    `ALTER TABLE \`accounts_communities\` MODIFY COLUMN \`valid_from\` datetime(3) NOT NULL;`,
  )
  await queryFn(
    `ALTER TABLE \`accounts_communities\` MODIFY COLUMN \`valid_to\` datetime(3) DEFAULT NULL;`,
  )
  await queryFn(
    `ALTER TABLE \`confirmed_transactions\` MODIFY COLUMN \`confirmed_at\` datetime(3) NOT NULL;`,
  )
}
