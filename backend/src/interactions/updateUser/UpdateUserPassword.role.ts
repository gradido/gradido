import { User } from '@entity/User'

import { UpdateUserInfosArgs } from '@/graphql/arg/UpdateUserInfosArgs'
import { PasswordEncryptionType } from '@/graphql/enum/PasswordEncryptionType'
import { isValidPassword } from '@/password/EncryptorUtils'
import { encryptPassword, verifyPassword } from '@/password/PasswordEncryptor'
import { LogError } from '@/server/LogError'

import { AbstractUpdateUserRole } from './AbstractUpdateUser.role'

export class UpdateUserPasswordRole extends AbstractUpdateUserRole {
  public update(user: User, { passwordNew, password }: UpdateUserInfosArgs): Promise<void> {
    if (password && passwordNew) {
      // Validate Password
      if (!isValidPassword(passwordNew)) {
        throw new LogError(
          'Please enter a valid password with at least 8 characters, upper and lower case letters, at least one number and one special character!',
        )
      }

      if (!verifyPassword(user, password)) {
        throw new LogError(`Old password is invalid`)
      }

      // Save new password hash and newly encrypted private key
      user.passwordEncryptionType = PasswordEncryptionType.GRADIDO_ID
      user.password = encryptPassword(user, passwordNew)
    }
    return Promise.resolve()
  }
}
