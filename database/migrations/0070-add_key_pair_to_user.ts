import { generateMnemonic, mnemonicToSeed } from 'bip39'
import { getMasterKeyFromSeed, getPublicKey } from 'ed25519-hd-key'

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('ALTER TABLE users ADD COLUMN public_key CHAR(64) NULL DEFAULT NULL;')
  await queryFn('ALTER TABLE users ADD COLUMN private_key_encrypted CHAR(160) NULL DEFAULT NULL;')
  await queryFn('ALTER TABLE users ADD COLUMN passphrase TEXT NULL DEFAULT NULL;')

  // Fill the database with freshly generated passphrases and corresponding public key.
  // The private or secret key is encrypted with the user's password, which is not stored in clear text.
  // So this can only be done when the user is logged in.
  const userIds = await queryFn(`SELECT id FROM users`)

  const promises: Promise<any>[] = []
  userIds.forEach((user) => {
    // generate mnemonic with 24 words (maximum)
    const mnemonic = generateMnemonic(256)
    promises.push(
      mnemonicToSeed(mnemonic).then((seedBytes) => {
        // get master private key from it
        // we can later derive more keys from it, so we have a HD wallet
        const { key } = getMasterKeyFromSeed(seedBytes.toString('hex'))
        // get public key from master private key
        const publicKeyBuffer = getPublicKey(key, false)
        promises.push(
          queryFn(`UPDATE users set public_key = ?, passphrase = ? where id = ?`, [
            publicKeyBuffer.toString('hex'),
            mnemonic,
            user.id,
          ]),
        )
      }),
    )
  })
  await Promise.all(promises)
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('ALTER TABLE users DROP COLUMN public_key;')
  await queryFn('ALTER TABLE users DROP COLUMN private_key_encrypted;')
  await queryFn('ALTER TABLE users DROP COLUMN passphrase;')
}
