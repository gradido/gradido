/* MIGRATION TO ADD CONTRIBUTION_LINKS
 *
 * This migration adds the table `contribution_links` in order to store all sorts of contribution_links data
 */

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`
      CREATE TABLE IF NOT EXISTS \`contribution_links\` (
        \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
        \`name\` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
        \`memo\` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
        \`valid_from\` datetime NOT NULL,
        \`valid_to\` datetime NULL,
        \`amount\` bigint(20) NOT NULL,
        \`cycle\` varchar(12) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ONCE',
        \`max_per_cycle\` int(10) unsigned NOT NULL DEFAULT '1',
        \`max_amount_per_month\` bigint(20) NULL DEFAULT NULL,
        \`total_max_count_of_contribution\` int(10) unsigned NULL DEFAULT NULL,
        \`max_account_balance\` bigint(20) NULL DEFAULT NULL,
        \`min_gap_hours\` int(10) unsigned NULL DEFAULT NULL,
        \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`deleted_at\` datetime NULL DEFAULT NULL,
        \`code\` varchar(24) COLLATE utf8mb4_unicode_ci NOT NULL,
        \`link_enabled\` tinyint(4) NOT NULL DEFAULT '1',
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`)
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // write downgrade logic as parameter of queryFn
  await queryFn(`DROP TABLE IF EXISTS \`contribution_links\`;`)
}
