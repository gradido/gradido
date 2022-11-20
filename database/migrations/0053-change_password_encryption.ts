/* MIGRATION TO ADD ENCRYPTION TYPE TO PASSWORDS
 *
 * This migration adds and renames columns in the table `users`
 */

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('ALTER TABLE users RENAME COLUMN created TO created_at;')
  await queryFn('ALTER TABLE users RENAME COLUMN deletedAt TO deleted_at;')
  // alter table emp rename column emp_name to name
  await queryFn(
    'ALTER TABLE users ADD COLUMN password_encryption_type int(10) NOT NULL DEFAULT 0 AFTER password;',
  )
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('ALTER TABLE users RENAME COLUMN created_at TO created;')
  await queryFn('ALTER TABLE users RENAME COLUMN deleted_at TO deletedAt;')
  await queryFn('ALTER TABLE users DROP COLUMN password_encryption_type;')
}
