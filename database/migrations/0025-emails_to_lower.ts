/* MIGRATION TO MAKE ALL EMAILS LOWERCASE
 *
 * Make all `email` values in `users` lowercase.
 * This allows safe queries without any modificators
 */

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('UPDATE `users` SET `email` = LOWER(`email`);')
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // This migration cannot be revered
}
