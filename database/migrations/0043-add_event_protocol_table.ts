/* MIGRATION TO ADD EVENT_PROTOCOL
 *
 * This migration adds the table `event_protocol` in order to store all sorts of business event data
 */

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`
      CREATE TABLE IF NOT EXISTS \`event_protocol\` (
        \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
        \`type\` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
        \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`user_id\` int(10) unsigned NOT NULL,
        \`x_user_id\` int(10) unsigned NULL DEFAULT NULL,
        \`x_community_id\` int(10) unsigned NULL DEFAULT NULL,
        \`transaction_id\` int(10) unsigned NULL DEFAULT NULL,
        \`contribution_id\` int(10) unsigned NULL DEFAULT NULL,
        \`amount\` bigint(20) NULL DEFAULT NULL,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`)
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // write downgrade logic as parameter of queryFn
  await queryFn(`DROP TABLE IF EXISTS \`event_protocol\`;`)
}
