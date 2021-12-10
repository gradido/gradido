/* MIGRATION FOR ADMIN INTERFACE
 *
 * This migration is special since it takes into account that
 * the database can be setup already but also may not be.
 * Therefore you will find all `CREATE TABLE` statements with
 * a `IF NOT EXISTS`, all `INSERT` with an `IGNORE` and in the
 * downgrade function all `DROP TABLE` with a `IF EXISTS`.
 * This ensures compatibility for existing or non-existing
 * databases.
 */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`
  ALTER TABLE \`login_pending_tasks_admin\`
    ADD COLUMN \`loginPendingTasksAdminId\` int UNSIGNED NOT NULL,
    ADD FOREIGN KEY FK_loginPendingTasksAdminId(loginPendingTasksAdminId)
      REFERENCES \`login_pending_tasks\`(id);
  `)
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`
  ALTER TABLE \`login_pending_tasks_admin\`
    DROP FOREIGN KEY FK_loginPendingTasksAdminId,
    DROP COLUMN \`loginPendingTasksAdminId\`;
  `)
}
