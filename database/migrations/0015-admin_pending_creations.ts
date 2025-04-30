/* MIGRATION TO PROPERLY STORE PENDING CREATIONS
 *
 * There were two tables for the pending tasks,
 * since the login_server used some crypto to store its
 * tasks there. It was easier to create a new table.
 * This migration drops the old unused table and renames
 * the new table to properly describe what it does
 */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // drop duplicate table, it was unused
  await queryFn('DROP TABLE `login_pending_tasks`;')

  // rename the new pending creations table to a proper table name
  await queryFn('RENAME TABLE `login_pending_tasks_admin` TO `admin_pending_creations`;')
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('RENAME TABLE `admin_pending_creations` TO `login_pending_tasks_admin`;')
  await queryFn(`
    CREATE TABLE \`login_pending_tasks\` (
      \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
      \`user_id\` int(10) unsigned DEFAULT 0,
      \`request\` varbinary(2048) NOT NULL,
      \`created\` datetime NOT NULL,
      \`finished\` datetime DEFAULT '2000-01-01 00:00:00',
      \`result_json\` text DEFAULT NULL,
      \`param_json\` text DEFAULT NULL,
      \`task_type_id\` int(10) unsigned NOT NULL,
      \`child_pending_task_id\` int(10) unsigned DEFAULT 0,
      \`parent_pending_task_id\` int(10) unsigned DEFAULT 0,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB AUTO_INCREMENT=795 DEFAULT CHARSET=utf8mb4
  `)
}
