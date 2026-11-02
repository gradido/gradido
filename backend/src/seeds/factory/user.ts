import { dbUserUpdatePassword, SeedUserRows, User, userFactory as userFactoryDb } from 'database'
import { PasswordEncryptionType } from 'shared'
import { encryptPassword } from '@/password/PasswordEncryptor'
import { writeHomeCommunityEntry } from '@/seeds/community'
import { UserInterface } from '@/seeds/users/UserInterface'

const SEED_USER_PASSWORD = 'Aa12345_'

export const userFactory = async (_client: any, user: UserInterface): Promise<User> => {
  const dbUser = await userFactoryDb(user, await writeHomeCommunityEntry())

  if (user.emailChecked) {
    const passwordHash = await encryptPassword(dbUser, SEED_USER_PASSWORD)
    await dbUserUpdatePassword(dbUser.id, PasswordEncryptionType.GRADIDO_ID, passwordHash)
    dbUser.password = passwordHash
  }
  return dbUser
}

/**
 * Sets the password of every seed user of this batch that has one - the users with a checked
 * address, which buildSeedUserRows gave GRADIDO_ID as salt type. Before the write and side by
 * side: the salt is the gradido id the rows already carry, and the hashing threads take the
 * derivations of the batch in parallel.
 */
export async function hashSeedUserPasswords(rows: SeedUserRows): Promise<void> {
  await Promise.all(
    rows.users
      .filter((user) => user.passwordEncryptionType === PasswordEncryptionType.GRADIDO_ID)
      .map(async (user) => {
        user.password = await encryptPassword(user, SEED_USER_PASSWORD)
      }),
  )
}
