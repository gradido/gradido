/* MIGRATION FOR ADMIN INTERFACE
 *
 * This migration adds the table `login_pending_tasks_admin` to store pending creations
 */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`
  CREATE TABLE IF NOT EXISTS \`login_pending_tasks_admin\` (
    \`id\` int UNSIGNED NOT NULL AUTO_INCREMENT,
    \`userId\` int UNSIGNED DEFAULT 0,
    \`created\` datetime NOT NULL,
    \`date\` datetime NOT NULL,
    \`memo\` text DEFAULT NULL,
    \`amount\` bigint(20) NOT NULL,
    \`moderator\` int UNSIGNED DEFAULT 0,
    PRIMARY KEY (\`id\`)
  ) ENGINE = InnoDB DEFAULT CHARSET=utf8mb4;
  `)
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`DROP TABLE IF EXISTS \`login_pending_tasks_admin\`;`)
}
