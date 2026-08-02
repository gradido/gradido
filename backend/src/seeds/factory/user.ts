import { PasswordEncryptionType } from '@enum/PasswordEncryptionType'
import {
  Community,
  dbUpdateUser,
  FullUser,
  UserInsertedWithContact,
  userFactoryBulk as userFactoryBulkDb,
  userFactory as userFactoryDb,
} from 'database'
import { type CryptographicSaltUser } from '@/password/EncryptorUtils'
import { encryptPassword } from '@/password/PasswordEncryptor'
import { writeHomeCommunityEntry } from '@/seeds/community'
import { UserInterface } from '@/seeds/users/UserInterface'
import { SEED_USER_DEFAULT_PASSWORD } from '../users'

// the seed factory returns drizzle types, the salt derivation expects the typeorm
// field names — map the two fields that differ
function toSaltUser(user: UserInsertedWithContact): CryptographicSaltUser {
  return {
    id: user.id,
    gradidoID: user.gradidoId,
    passwordEncryptionType: PasswordEncryptionType.EMAIL,
    emailContact: user.emailContact,
  }
}

async function setSeedPassword(user: UserInsertedWithContact): Promise<void> {
  const passwortHash = await encryptPassword(toSaltUser(user), SEED_USER_DEFAULT_PASSWORD)
  user.password = passwortHash
  const result = await dbUpdateUser(user.id, { password: passwortHash })
  if (!result.success) {
    throw result.error
  }
}

export async function userFactory(_client: any, user: UserInterface): Promise<FullUser> {
  const homeCom = await writeHomeCommunityEntry()
  const seededUser = await userFactoryDb(user, homeCom)

  if (user.emailChecked) {
    await setSeedPassword(seededUser)
  }
  return seededUser
}

export async function userFactoryBulk(
  users: UserInterface[],
  homeCommunity?: Community | null,
): Promise<Map<string, UserInsertedWithContact>> {
  const emailUserId = await userFactoryBulkDb(users, homeCommunity)

  await Promise.all(
    Array.from(emailUserId.values()).map(async (user: UserInsertedWithContact) => {
      if (user.emailContact.emailChecked) {
        await setSeedPassword(user);
      }
    })
  )
  return emailUserId
}
