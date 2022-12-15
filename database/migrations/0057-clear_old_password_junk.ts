/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('ALTER TABLE users DROP COLUMN public_key;')
  await queryFn('ALTER TABLE users DROP COLUMN privkey;')
  await queryFn('ALTER TABLE users DROP COLUMN email_hash;')
  await queryFn('ALTER TABLE users DROP COLUMN passphrase;')
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('ALTER TABLE users ADD COLUMN public_key binary(32) DEFAULT NULL;')
  await queryFn('ALTER TABLE users ADD COLUMN privkey binary(80) DEFAULT NULL;')
  await queryFn('ALTER TABLE users ADD COLUMN email_hash binary(32) DEFAULT NULL;')
  await queryFn('ALTER TABLE users ADD COLUMN passphrase text DEFAULT NULL;')
}
