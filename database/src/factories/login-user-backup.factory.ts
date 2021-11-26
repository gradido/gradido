import Faker from 'faker'
import { define } from 'typeorm-seeding'
import { LoginUserBackup } from '../../entity/LoginUserBackup'
import { LoginUserBackupContext } from '../interface/UserContext'

define(LoginUserBackup, (faker: typeof Faker, context?: LoginUserBackupContext) => {
  if (!context) context = {}
  if (!context.userId) throw new Error('LoginUserBackup: No userId present!')

  const userBackup = new LoginUserBackup()
  // TODO: Get the real passphrase
  userBackup.passphrase = context.passphrase ? context.passphrase : faker.random.words(24)
  userBackup.mnemonicType = context.mnemonicType ? context.mnemonicType : 2
  userBackup.userId = context.userId

  return userBackup
})
