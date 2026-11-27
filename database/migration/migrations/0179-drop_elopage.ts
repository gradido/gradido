// Elopage is no longer part of Gradido (#4309). Two things only it needed go:
// - `login_elopage_buys`: its webhook is gone, so the table gets no new rows, and nothing reads
//   the old ones any more.
// - `users.publisher_id`: the publisher id (`?pid=` in a wallet link) only ever credited an
//   Elopage affiliate; the wallet merely stored it and sent it back.
// The rows and values are dropped with them.
//
// The downgrade brings both back empty: the table as 0003 and 0021 left it, the column where
// 0172 left it, every row at its default 0.
export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('DROP TABLE IF EXISTS `login_elopage_buys`;')
  await queryFn('ALTER TABLE `users` DROP COLUMN IF EXISTS `publisher_id`;')
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    'ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `publisher_id` int(10) unsigned DEFAULT 0 AFTER `contribution_link_id`;',
  )
  await queryFn(`
    CREATE TABLE IF NOT EXISTS \`login_elopage_buys\` (
      \`id\` int unsigned NOT NULL AUTO_INCREMENT,
      \`elopage_user_id\` int DEFAULT NULL,
      \`affiliate_program_id\` int DEFAULT NULL,
      \`publisher_id\` int DEFAULT NULL,
      \`order_id\` int DEFAULT NULL,
      \`product_id\` int DEFAULT NULL,
      \`product_price\` int NOT NULL,
      \`payer_email\` varchar(255) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
      \`publisher_email\` varchar(255) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
      \`payed\` tinyint NOT NULL,
      \`success_date\` datetime NOT NULL,
      \`event\` varchar(255) NOT NULL,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
  `)
}
