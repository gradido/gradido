import {
  Community,
  dbUpdateUserPassword,
  SeedUser,
  userFactoryBulk as userFactoryBulkDb,
  userFactory as userFactoryDb,
} from 'database'
import { type CryptographicSaltUser } from '@/password/EncryptorUtils'
import { encryptPassword } from '@/password/PasswordEncryptor'
import { writeHomeCommunityEntry } from '@/seeds/community'
import { UserInterface } from '@/seeds/users/UserInterface'

// the seed factory returns drizzle types, the salt derivation expects the typeorm
// field names — map the two fields that differ
const toSaltUser = (user: SeedUser): CryptographicSaltUser => ({
  id: user.id,
  gradidoID: user.gradidoId,
  passwordEncryptionType: user.passwordEncryptionType,
  emailContact: user.emailContact,
})

const setSeedPassword = async (user: SeedUser): Promise<void> => {
  const passwortHash = await encryptPassword(toSaltUser(user), 'Aa12345_')
  user.password = passwortHash
  const result = await dbUpdateUserPassword(user.id, passwortHash)
  if (!result.success) {
    throw result.error
  }
}

export const userFactory = async (_client: any, user: UserInterface): Promise<SeedUser> => {
  const homeCom = await writeHomeCommunityEntry()
  const dbUser = await userFactoryDb(user, homeCom)

  if (user.emailChecked) {
    await setSeedPassword(dbUser)
  }
  return dbUser
}

export async function userFactoryBulk(users: UserInterface[], homeCommunity?: Community | null) {
  if (!homeCommunity) {
    homeCommunity = await writeHomeCommunityEntry()
  }
  const dbUsers = await userFactoryBulkDb(users, homeCommunity)
  for (const dbUser of dbUsers) {
    if (dbUser.emailContact.emailChecked) {
      await setSeedPassword(dbUser)
    }
  }
  return dbUsers
}
