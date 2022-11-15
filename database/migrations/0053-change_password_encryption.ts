/* MIGRATION TO ADD ENCRYPTION TO PASSWORDS
 *
 * This migration adds and renames columns to and in the table `users`
 */

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('ALTER TABLE users RENAME COLUMN created TO created_at;')
  await queryFn('ALTER TABLE users RENAME COLUMN deletedAt TO deleted_at;')
  // alter table emp rename column emp_name to name
  await queryFn(
    'ALTER TABLE users ADD COLUMN password_encryption_type int(10) NOT NULL DEFAULT 1 AFTER password;',
  )

  // TODO these steps comes after verification and test
  /*
  await queryFn('ALTER TABLE users DROP COLUMN public_key;')
  await queryFn('ALTER TABLE users DROP COLUMN privkey;')
  await queryFn('ALTER TABLE users DROP COLUMN email_hash;')
  await queryFn('ALTER TABLE users DROP COLUMN passphrase;')
  */
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('ALTER TABLE users RENAME COLUMN created_at TO created;')
  await queryFn('ALTER TABLE users RENAME COLUMN deleted_at TO deletedAt;')
  await queryFn('ALTER TABLE users DROP COLUMN password_encryption_type;')

  // TODO these steps comes after verification and test
  /*
  await queryFn('ALTER TABLE users ADD COLUMN public_key binary(32) DEFAULT NULL;')
  await queryFn('ALTER TABLE users ADD COLUMN privkey binary(80) DEFAULT NULL;')
  await queryFn('ALTER TABLE users ADD COLUMN email_hash binary(32) DEFAULT NULL;')
  await queryFn('ALTER TABLE users ADD COLUMN passphrase text DEFAULT NULL;')
  */
}
