/* MIGRATION TO ALIGN COLLATIONS
 *
 * in oder to be able to compare `login_users` with `state_users`
 * when the databases default is not `utf8mb4_unicode_ci`, we need
 * to also explicitly define it in the table
 *
 */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    'ALTER TABLE `login_users` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;',
  )
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('ALTER TABLE `login_users` CONVERT TO CHARACTER SET utf8mb4;')
}
