import Faker from 'faker'
import { define } from 'typeorm-seeding'
import { LoginUserBackup } from '../../entity/LoginUserBackup'

interface LoginUserBackupContext {
  passphrase?: string
  mnemonicType?: number
}

define(LoginUserBackup, (faker: typeof Faker, context?: LoginUserBackupContext) => {
  if (!context) context = {}

  const userBackup = new LoginUserBackup()
  userBackup.passphrase = context.passphrase ? context.passphrase : faker.random.words(24)
  userBackup.mnemonicType = context.mnemonicType ? context.mnemonicType : 2

  return userBackup
})
