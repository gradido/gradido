/* MIGRATION TO CLEAN PRODUCTION DATA
 *
 * delete the pending tasks to not have any dead entries.
 * the way we interact with the table is now differently
 * and therefore we should clear it to avoid conflicts
 * and dead entries
 */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('DELETE FROM `login_pending_tasks`;')
}

export async function downgrade(
  /* queryFn: (query: string, values?: any[]) => Promise<Array<any>> */
) {
  // cannot undelete things
}
