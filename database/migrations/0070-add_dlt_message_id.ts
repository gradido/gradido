/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('ALTER TABLE transactions ADD COLUMN dlt_transaction_id binary(32) DEFAULT NULL;')
  await queryFn('ALTER TABLE transactions ADD COLUMN dlt_confirmed bool DEFAULT false;')
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('ALTER TABLE transactions DROP COLUMN dlt_transaction_id;')
  await queryFn('ALTER TABLE transactions DROP COLUMN dlt_confirmed;')
}
