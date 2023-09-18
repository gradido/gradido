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
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    `ALTER TABLE \`communities\` MODIFY COLUMN \`root_privkey\` binary(32) DEFAULT NULL;`,
  )
  await queryFn(`ALTER TABLE \`communities\` MODIFY COLUMN \`root_pubkey\` binary(32) NOT NULL;`)
  await queryFn(
    `ALTER TABLE \`communities\` MODIFY COLUMN \`root_chaincode\` binary(32) DEFAULT NULL;`,
  )
}
