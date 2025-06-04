/* MIGRATION TO REMOVE sendEmail FIELD FROM TRANSACTION_LINK TABLE */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('ALTER TABLE `transaction_links` DROP COLUMN `showEmail`;')
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    'ALTER TABLE `transaction_links` ADD COLUMN `showEmail` boolean NOT NULL DEFAULT false AFTER `validUntil`;',
  )
}
