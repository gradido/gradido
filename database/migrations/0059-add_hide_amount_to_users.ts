/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('ALTER TABLE users ADD COLUMN hideAmountGDD bool DEFAULT false;')
  await queryFn('ALTER TABLE users ADD COLUMN hideAmountGDT bool DEFAULT false;')
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('ALTER TABLE users DROP COLUMN hideAmountGDD;')
  await queryFn('ALTER TABLE users DROP COLUMN hideAmountGDT;')
}
