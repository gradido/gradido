import {
  Community,
  FullUser,
  User,
  userFactoryBulk as userFactoryBulkDb,
  userFactory as userFactoryDb,
} from 'database'
import { In } from 'typeorm'
import { encryptPassword } from '@/password/PasswordEncryptor'
import { writeHomeCommunityEntry } from '@/seeds/community'
import { UserInterface } from '@/seeds/users/UserInterface'

export const userFactory = async (_client: any, user: UserInterface): Promise<User> => {
  const homeCom = await writeHomeCommunityEntry()
  const seededUser = await userFactoryDb(user, homeCom)
  // the database seeds work with drizzle now, but the backend still expects the typeorm entity
  // deleted users are seeded as well, so they must not be filtered out here
  const dbUser = await User.findOneOrFail({
    where: { id: seededUser.id },
    relations: { community: true, emailContact: true },
    withDeleted: true,
  })

  if (user.emailChecked) {
    dbUser.password = await encryptPassword(dbUser, 'Aa12345_')
    await dbUser.save()
  }
  return dbUser
}

export async function userFactoryBulk(
  users: UserInterface[],
  homeCommunity?: Community | null,
): Promise<FullUser[]> {
  if (!homeCommunity) {
    homeCommunity = await writeHomeCommunityEntry()
  }
  const dbUsers = await userFactoryBulkDb(users, homeCommunity)

  const userIdsWithPassword = dbUsers
    .filter((dbUser) => dbUser.emailContact.emailChecked)
    .map((dbUser) => dbUser.id)
  if (userIdsWithPassword.length > 0) {
    // password encryption needs the typeorm entity, which isn't migrated to drizzle yet
    const dbUserEntities = await User.find({
      where: { id: In(userIdsWithPassword) },
      relations: { emailContact: true },
      withDeleted: true,
    })
    for (const dbUserEntity of dbUserEntities) {
      dbUserEntity.password = await encryptPassword(dbUserEntity, 'Aa12345_')
      await dbUserEntity.save()
    }
  }
  return dbUsers
}
