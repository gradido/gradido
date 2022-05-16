/* MIGRATION TO SET previous COLUMN UNIQUE in TRANSACTION table
 */

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('ALTER TABLE `transactions` ADD UNIQUE(`previous`);')
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('ALTER TABLE  `transactions` DROP INDEX `previous`;')
}
