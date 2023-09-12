/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // write upgrade logic as parameter of queryFn
  await queryFn(`ALTER TABLE \`communities\` MODIFY COLUMN \`root_privkey\` binary(64) NOT NULL;`)
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`ALTER TABLE \`communities\` MODIFY COLUMN \`root_privkey\` binary(32) NOT NULL;`)
}
