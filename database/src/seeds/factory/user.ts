import random from 'random-bigint'
import { OptInType, PasswordEncryptionType, UserContactType } from 'shared'
import { v4 } from 'uuid'
import { RoleNames } from '../../enum/RoleNames'
import { getHomeCommunityDrizzle } from '../../queries/communities'
import {
  dbFindLastUserContactId,
  dbInsertAndSelectUserContact,
} from '../../queries/userContacts.drizzle'
import { dbInsertAndSelectUserRoles } from '../../queries/userRoles.drizzle'
import {
  dbFindLastUserId,
  dbInsertAndSelectUser,
  dbInsertUsersWithContactsAndRoles,
  dbUpdateUser,
} from '../../queries/users.drizzle'
import {
  CommunitiesSelect,
  FullUser,
  UserContactInsert,
  UserInsert,
  UserInsertedWithContact,
  UserRoleInsert,
  UserRoleSelect,
  UserSelect,
} from '../../schemas'
import { UserInterface } from '../users/UserInterface'

/**
 * Only the community uuid is used from the home community, so both the drizzle row
 * and the (not yet migrated) typeorm entity can be handed in.
 */
type HomeCommunity = Pick<CommunitiesSelect, 'communityUuid'>

export async function userFactory(
  user: UserInterface,
  homeCommunity?: HomeCommunity | null,
): Promise<FullUser> {
  if (!homeCommunity) {
    // no cache, seeds and tests recreate the home community
    homeCommunity = await getHomeCommunityDrizzle(false)
  }
  const insertedUser = await dbInsertAndSelectUser(buildUser(user, homeCommunity))
  if (!insertedUser.success) {
    throw insertedUser.error
  }
  const dbUser = insertedUser.value

  const insertedUserContact = await dbInsertAndSelectUserContact(buildUserContact(user, dbUser.id))
  if (!insertedUserContact.success) {
    throw insertedUserContact.error
  }
  const emailContact = insertedUserContact.value

  const updatedUser = await dbUpdateUser(dbUser.id, { emailId: emailContact.id })
  if (!updatedUser.success) {
    throw updatedUser.error
  }
  dbUser.emailId = emailContact.id

  const userRoles: UserRoleSelect[] = []
  const userRole = user.role as RoleNames
  if (userRole === RoleNames.ADMIN || userRole === RoleNames.MODERATOR) {
    const insertedUserRole = await dbInsertAndSelectUserRoles(buildUserRole(dbUser.id, userRole))
    if (!insertedUserRole.success) {
      throw insertedUserRole.error
    }
    userRoles.push(insertedUserRole.value)
  }

  return { ...dbUser, emailContact, userRoles }
}

// only use in non-parallel environment (seeding for example)
// return map with user email as key and the user id as value
export async function userFactoryBulk(
  users: UserInterface[],
  homeCommunity?: HomeCommunity | null,
): Promise<Map<string, UserInsertedWithContact>> {
  if (!homeCommunity) {
    // no cache, seeds and tests recreate the home community
    homeCommunity = await getHomeCommunityDrizzle(false)
  }
  // ids are assigned manually, so users, contacts and roles can reference each other
  // before they are written to the db
  let userId = (await dbFindLastUserId()) + 1
  let emailId = (await dbFindLastUserContactId()) + 1

  const userIds: number[] = []
  const dbUsers: UserInsert[] = []
  const dbUserContacts: UserContactInsert[] = []
  const dbUserRoles: UserRoleInsert[] = []
  const emailUsers: Map<string, UserInsertedWithContact> = new Map()

  for (const user of users) {
    const userInsert = { ...buildUser(user, homeCommunity), id: userId, emailId }
    dbUsers.push(userInsert)
    const emailContact = { ...buildUserContact(user, userId), id: emailId }
    dbUserContacts.push(emailContact)
    if (user.email) {
      emailUsers.set(user.email, { ...userInsert, emailContact })
    }
    const userRole = user.role as RoleNames
    if (
      userRole === RoleNames.ADMIN ||
      userRole === RoleNames.MODERATOR ||
      userRole === RoleNames.MODERATOR_AI
    ) {
      dbUserRoles.push(buildUserRole(userId, userRole))
    }
    userIds.push(userId)
    userId++
    emailId++
  }

  const result = await dbInsertUsersWithContactsAndRoles(dbUsers, dbUserContacts, dbUserRoles)
  if (!result.success) {
    throw result.error
  }
  return emailUsers
}

export function buildUser(user: UserInterface, homeCommunity?: HomeCommunity | null): UserInsert {
  const dbUser: UserInsert = {
    gradidoId: v4(),
    firstName: user.firstName ?? '',
    lastName: user.lastName ?? '',
    language: user.language ?? 'en',
    createdAt: user.createdAt ?? new Date(),
    deletedAt: user.deletedAt ?? null,
    publisherId: user.publisherId ?? 0,
    humhubAllowed: 1,
  }
  if (user.alias) {
    dbUser.alias = user.alias
  }
  if (user.emailChecked) {
    // dbUser.password =
    dbUser.passwordEncryptionType = PasswordEncryptionType.GRADIDO_ID
  }
  if (homeCommunity?.communityUuid) {
    dbUser.communityUuid = homeCommunity.communityUuid
  }

  return dbUser
}

export function buildUserContact(user: UserInterface, userId: number): UserContactInsert {
  const dbUserContact: UserContactInsert = {
    email: user.email ?? '',
    type: UserContactType.USER_CONTACT_EMAIL,
    userId,
  }

  if (user.createdAt) {
    dbUserContact.createdAt = user.createdAt
    dbUserContact.updatedAt = user.createdAt
  }
  if (user.emailChecked) {
    dbUserContact.emailVerificationCode = random(64).valueOf()
    dbUserContact.emailOptInTypeId = OptInType.EMAIL_OPT_IN_REGISTER
    dbUserContact.emailChecked = 1
  }

  return dbUserContact
}

export function buildUserRole(userId: number, role: RoleNames): UserRoleInsert {
  return { userId, role }
}
