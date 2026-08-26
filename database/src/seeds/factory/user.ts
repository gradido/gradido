import random from 'random-bigint'
import { OptInType, PasswordEncryptionType, UserContactType } from 'shared'
import { v4 } from 'uuid'
import { RoleNames } from '../../enum/RoleNames'
import { getHomeCommunityDrizzle } from '../../queries/communities'
import {
  dbFindLastUserId,
  dbFindUsersByIds,
  dbInsertUser,
  dbInsertUsersWithContactsAndRoles,
  dbUpdateUserEmailId,
} from '../../queries/user'
import {
  dbFindLastUserContactId,
  dbFindUserContactsByUserIds,
  dbInsertUserContact,
} from '../../queries/userContacts'
import { dbFindUserRolesByUserIds, dbInsertUserRole } from '../../queries/userRoles'
import {
  CommunitiesSelect,
  FullUser,
  UserContactInsert,
  UserContactSelect,
  UserInsert,
  UserRoleInsert,
  UserRoleSelect,
  UserSelect,
} from '../../schemas'
import { UserInterface } from '../users/UserInterface'

export async function userFactory(
  user: UserInterface,
  homeCommunity?: CommunitiesSelect | null,
): Promise<FullUser> {
  const community = homeCommunity ?? (await getHomeCommunityDrizzle())
  const insertedUser = await insertUser(buildUser(user, community))
  const emailContact = await insertUserContact(buildUserContact(user, insertedUser.id))

  const emailIdResult = await dbUpdateUserEmailId(insertedUser.id, emailContact.id)
  if (!emailIdResult.success) {
    throw emailIdResult.error
  }
  insertedUser.emailId = emailContact.id

  const userRoles: UserRoleSelect[] = []
  const userRole = user.role as RoleNames
  if (userRole && (userRole === RoleNames.ADMIN || userRole === RoleNames.MODERATOR)) {
    userRoles.push(await insertUserRole(buildUserRole(insertedUser.id, userRole)))
  }

  return { ...insertedUser, community, emailContact, userRoles }
}

// only use in non-parallel environment (seeding for example)
export async function userFactoryBulk(
  users: UserInterface[],
  homeCommunity?: CommunitiesSelect | null,
): Promise<FullUser[]> {
  const community = homeCommunity ?? (await getHomeCommunityDrizzle())

  const userRows: UserInsert[] = []
  const userContactRows: UserContactInsert[] = []
  const userRoleRows: UserRoleInsert[] = []

  let userId = (await dbFindLastUserId()) + 1
  let emailId = (await dbFindLastUserContactId()) + 1

  for (const user of users) {
    userRows.push({ ...buildUser(user, community), id: userId, emailId })
    userContactRows.push({ ...buildUserContact(user, userId), id: emailId })

    const userRole = user.role as RoleNames
    if (userRole && (userRole === RoleNames.ADMIN || userRole === RoleNames.MODERATOR)) {
      userRoleRows.push(buildUserRole(userId, userRole))
    }

    userId++
    emailId++
  }

  const result = await dbInsertUsersWithContactsAndRoles(userRows, userContactRows, userRoleRows)
  if (!result.success) {
    throw result.error
  }

  // read the rows back instead of reconstructing them, so defaults filled in by
  // the database (timestamps, flags) are the ones the caller sees
  const userIds = userRows.map((userRow) => userRow.id!)
  const insertedUsers = await dbFindUsersByIds(userIds)
  const insertedContacts = await dbFindUserContactsByUserIds(userIds)
  const insertedRoles = await dbFindUserRolesByUserIds(userIds)

  const contactsByUserId = new Map(insertedContacts.map((contact) => [contact.userId, contact]))
  return insertedUsers.map((insertedUser) => ({
    ...insertedUser,
    community,
    emailContact: contactsByUserId.get(insertedUser.id)!,
    userRoles: insertedRoles.filter((role) => role.userId === insertedUser.id),
  }))
}

export function buildUser(
  user: UserInterface,
  homeCommunity?: CommunitiesSelect | null,
): UserInsert {
  return {
    firstName: user.firstName ?? '',
    lastName: user.lastName ?? '',
    ...(user.alias ? { alias: user.alias } : {}),
    language: user.language ?? 'en',
    createdAt: user.createdAt ?? new Date(),
    deletedAt: user.deletedAt ?? null,
    publisherId: user.publisherId ?? 0,
    humhubAllowed: 1,
    gradidoId: v4(),
    // password is set by the caller (the backend seed factory hashes it)
    passwordEncryptionType: user.emailChecked
      ? PasswordEncryptionType.GRADIDO_ID
      : PasswordEncryptionType.NO_PASSWORD,
    ...(homeCommunity ? { communityUuid: homeCommunity.communityUuid! } : {}),
  }
}

export function buildUserContact(user: UserInterface, userId: number): UserContactInsert {
  return {
    email: user.email ?? '',
    type: UserContactType.USER_CONTACT_EMAIL,
    userId,
    ...(user.createdAt ? { createdAt: user.createdAt, updatedAt: user.createdAt } : {}),
    ...(user.emailChecked
      ? {
          // random-bigint is typed as the BigInt wrapper, drizzle wants the primitive
          emailVerificationCode: BigInt(random(64).toString()),
          emailOptInTypeId: OptInType.EMAIL_OPT_IN_REGISTER,
          emailChecked: 1,
        }
      : {}),
  }
}

export function buildUserRole(userId: number, role: RoleNames): UserRoleInsert {
  return { userId, role }
}

async function insertUser(user: UserInsert): Promise<UserSelect> {
  const result = await dbInsertUser(user)
  if (!result.success) {
    throw result.error
  }
  return result.value
}

async function insertUserContact(userContact: UserContactInsert): Promise<UserContactSelect> {
  const result = await dbInsertUserContact(userContact)
  if (!result.success) {
    throw result.error
  }
  return result.value
}

async function insertUserRole(userRole: UserRoleInsert): Promise<UserRoleSelect> {
  const result = await dbInsertUserRole(userRole)
  if (!result.success) {
    throw result.error
  }
  return result.value
}
