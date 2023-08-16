import { User } from '@entity/User'

import { HDWallet } from './HDWallet'
import { SecretKeyCryptography } from './SecretKeyCryptography'
import { LogError } from '@/server/LogError'

export const encryptPassword = (dbUser: User, password: string): bigint => {
  const secretKey = new SecretKeyCryptography(dbUser, password)
  return secretKey.getShortHash()
}

export const verifyPassword = (dbUser: User, password: string): boolean => {
  return dbUser.password.valueOf() === encryptPassword(dbUser, password)
}

export const verifyPasswordWithSecretKey = (
  dbUser: User,
  secretKey: SecretKeyCryptography,
): boolean => {
  return dbUser.password.valueOf() === secretKey.getShortHash()
}

/**
 * update password, and encrypted private key on user,
 * generate mnemonic if public key and mnemonic both are empty
 * @param user user db object
 * @param password new password
 * @param secretKeyOld secret key from login for 'normal' password change
 */
export const updatePasswordOnDBUser = (
  user: User,
  password: string,
  secretKeyOld: SecretKeyCryptography | null,
): void => {
  const secretKey = new SecretKeyCryptography(user, password)
  user.password = secretKey.getShortHash()

  let wallet: HDWallet | null = null
  // update key pair

  // TODO: Don't store passphrase unencrypted, save it later with moderator or chosen friends public keys encrypted
  // create passphrase if not already exist and only if no public key exist for user
  // TODO: store account type (CryptoAccount|ManagedAccount)
  if (!user.passphrase && !user.publicKey) {
    user.passphrase = HDWallet.generateMnemonic()
  }
  // we don't have a passphrase, this must be a crypto account
  if (!user.passphrase && secretKeyOld) {
    // if we have the previous crypto key, we can restore wallet from encrypted private key
    wallet = HDWallet.createFromUserLogin(user, secretKeyOld)
  } else if (user.passphrase) {
    // we restore wallet from passphrase
    wallet = HDWallet.createFromPassphrase(user.passphrase)
  }
  if (!wallet) {
    // for example someone with crypto account try to reset password
    throw new LogError("couldn't restore wallet!")
  }

  // if we already have a public key and the public key of restored wallet differ, than somewhere is a bug
  if (user.publicKey && wallet.getRootPublicKeyHex() !== user.publicKey) {
    throw new LogError('public key changed!')
  }
  user.publicKey = wallet.getRootPublicKeyHex()
  user.privateKeyEncrypted = wallet.getRootPrivateKeyEncryptedHex(secretKey)
}
