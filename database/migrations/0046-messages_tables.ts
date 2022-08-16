/**
 * MIGRATION TO CREATE THE MESSAGES TABLES
 *
 * This migration creates the `messages` tables in the `community_server` database (`gradido_community`).
 * This is done to keep all data in the same place and is to be understood in conjunction with the next migration
 * `0046-messages_tables` which will fill the tables with the existing data
 */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`
    CREATE TABLE IF NOT EXISTS \`messages\` (
      \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
      \`contribution_id\` int(10) unsigned NOT NULL,
      \`user_id\` int(10) unsigned NOT NULL,
      \`message\` varchar(2000) NOT NULL,
      \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `)
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`DROP TABLE IF EXISTS \`messages\`;`)
}
