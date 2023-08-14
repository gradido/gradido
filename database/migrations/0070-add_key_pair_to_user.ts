export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('ALTER TABLE users ADD COLUMN public_key CHAR(64) NULL DEFAULT NULL;')
  await queryFn('ALTER TABLE users ADD COLUMN private_key_encrypted CHAR(160) NULL DEFAULT NULL;')
  await queryFn('ALTER TABLE users ADD COLUMN passphrase TEXT NULL DEFAULT NULL;')
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('ALTER TABLE users DROP COLUMN public_key;')
  await queryFn('ALTER TABLE users DROP COLUMN private_key_encrypted;')
  await queryFn('ALTER TABLE users DROP COLUMN passphrase;')
}
