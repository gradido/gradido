import { User, userFactory as userFactoryDb, userFactoryBulk as userFactoryBulkDb, Community } from 'database'

import { writeHomeCommunityEntry } from '@/seeds/community'
import { UserInterface } from '@/seeds/users/UserInterface'
import { encryptPassword } from '@/password/PasswordEncryptor'

export const userFactory = async (
  _client: any,
  user: UserInterface,
): Promise<User> => {
  const homeCom = await writeHomeCommunityEntry()
  const dbUser = await userFactoryDb(user, homeCom)

  if (user.emailChecked) {
    const passwortHash = await encryptPassword(dbUser, 'Aa12345_')
    dbUser.password = passwortHash
    await dbUser.save()
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
      const passwortHash = await encryptPassword(dbUser, 'Aa12345_')
      dbUser.password = passwortHash
      await dbUser.save()
    }
  }
  return dbUsers
}