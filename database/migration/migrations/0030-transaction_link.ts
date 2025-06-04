/* MIGRATION TO CREATE TRANSACTION_LINK TABLE */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`
    CREATE TABLE \`transaction_links\` (
      \`id\` int UNSIGNED NOT NULL AUTO_INCREMENT,
      \`userId\` int UNSIGNED NOT NULL,
      \`amount\` DECIMAL(40,20) NOT NULL,
      \`hold_available_amount\` DECIMAL(40,20) NOT NULL,
      \`memo\` varchar(255) NOT NULL,
      \`code\` varchar(24) NOT NULL,
      \`createdAt\` datetime NOT NULL,
      \`deletedAt\` datetime DEFAULT NULL,
      \`validUntil\` datetime NOT NULL,
      \`showEmail\` boolean NOT NULL DEFAULT false,
      \`redeemedAt\` datetime,
      \`redeemedBy\` int UNSIGNED,
      PRIMARY KEY (\`id\`)
    ) ENGINE = InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `)
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`DROP TABLE \`transaction_links\`;`)
}
