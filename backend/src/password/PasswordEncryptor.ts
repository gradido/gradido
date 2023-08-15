import { User } from '@entity/User'

import { SecretKeyCryptography } from './SecretKeyCryptography'

export const encryptPassword = (dbUser: User, password: string): bigint => {
  const secretKeyCryptography = new SecretKeyCryptography(dbUser, password)
  return secretKeyCryptography.getShortHash()
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
