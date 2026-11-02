// AI-GENERATED — not an architecture reference
import random from 'random-bigint'
import {
  fullName,
  MissingHomeCommunityError,
  OptInType,
  PasswordEncryptionType,
  UserContactType,
} from 'shared'
import { v4 } from 'uuid'
import { DrizzleTransaction } from '../../AppDatabase'
import {
  ALIAS_ORIGIN_ADOPTED,
  Community,
  User,
  UserAlias,
  UserContact,
  UserRole,
} from '../../entity'
import { AccountState } from '../../enum/AccountState'
import { RoleNames } from '../../enum/RoleNames'
import { getHomeCommunity } from '../../queries/communities'
import { dbInsertUsers } from '../../queries/user'
import { dbInsertUserAliases } from '../../queries/userAliases'
import { dbInsertUserContacts } from '../../queries/userContacts'
import { dbInsertUserRoles } from '../../queries/userRoles'
import {
  UserAliasInsert,
  UserContactInsert,
  UserInsert,
  UserRoleInsert,
} from '../../schemas/drizzle.schema'
import { UserInterface } from '../users/UserInterface'

export async function userFactory(
  user: UserInterface,
  homeCommunity?: Community | null,
): Promise<User> {
  // TODO: improve with cascade
  let dbUser = await createUser(user, homeCommunity)
  const dbUserContact = await createUserContact(user, dbUser.id)
  dbUser.emailId = dbUserContact.id
  dbUser.emailContact = dbUserContact
  dbUser = await dbUser.save()
  await createUserAlias(dbUser.id, dbUser.alias)

  const userRole = user.role as RoleNames
  if (userRole && (userRole === RoleNames.ADMIN || userRole === RoleNames.MODERATOR)) {
    dbUser.userRole = await createUserRole(dbUser.id, userRole)
  }

  return dbUser
}

export async function createUser(
  user: UserInterface,
  homeCommunity?: Community | null,
  store: boolean = true,
): Promise<User> {
  const dbUser = new User()
  dbUser.firstName = user.firstName ?? ''
  dbUser.lastName = user.lastName ?? ''
  dbUser.alias = user.alias
  dbUser.language = user.language ?? 'en'
  dbUser.createdAt = user.createdAt ?? new Date()
  dbUser.deletedAt = user.deletedAt ?? null
  dbUser.accountState = dbUser.deletedAt
    ? AccountState.DELETED
    : user.emailChecked
      ? AccountState.ACTIVATED
      : AccountState.REGISTERED
  dbUser.publisherId = user.publisherId ?? 0
  dbUser.humhubAllowed = true
  dbUser.gradidoID = user.gradidoId ?? v4()

  if (user.emailChecked) {
    // dbUser.password =
    dbUser.passwordEncryptionType = PasswordEncryptionType.GRADIDO_ID
  }
  if (!homeCommunity) {
    homeCommunity = await getHomeCommunity()
  }
  if (!homeCommunity || !homeCommunity.communityUuid) {
    throw new MissingHomeCommunityError()
  }

  dbUser.community = homeCommunity
  dbUser.communityUuid = homeCommunity.communityUuid!

  return store ? dbUser.save() : dbUser
}

export async function createUserContact(
  user: UserInterface,
  userId?: number,
  store: boolean = true,
): Promise<UserContact> {
  const dbUserContact = new UserContact()

  dbUserContact.email = user.email ?? ''
  dbUserContact.type = UserContactType.USER_CONTACT_EMAIL

  if (user.createdAt) {
    dbUserContact.createdAt = user.createdAt
    dbUserContact.updatedAt = user.createdAt
  }
  if (user.emailChecked) {
    dbUserContact.emailVerificationCode = random(64).toString()
    dbUserContact.emailOptInTypeId = OptInType.EMAIL_OPT_IN_REGISTER
    dbUserContact.emailChecked = true
  }

  if (userId) {
    dbUserContact.userId = userId
  }

  return store ? dbUserContact.save() : dbUserContact
}

export async function createUserRole(
  userId: number,
  role: RoleNames,
  store: boolean = true,
): Promise<UserRole> {
  const dbUserRole = new UserRole()
  dbUserRole.userId = userId
  dbUserRole.role = role
  return store ? dbUserRole.save() : dbUserRole
}

// Every alias a member holds has its row in `user_aliases`, as registration and migration
// 0116 write it. `adopted`: a name that is already settled, and costs none of the four picks.
export async function createUserAlias(
  userId: number,
  alias: string,
  store: boolean = true,
): Promise<UserAlias> {
  const dbUserAlias = new UserAlias()
  dbUserAlias.userId = userId
  dbUserAlias.alias = alias
  dbUserAlias.origin = ALIAS_ORIGIN_ADOPTED
  return store ? dbUserAlias.save() : dbUserAlias
}

/** A `users` row as the seed builds it: id, email id and gradido id are known before the write. */
export type SeedUserRow = UserInsert & { id: number; emailId: number; gradidoId: string }

/**
 * What the creations and transaction links of the seed need of a member, kept after the rows
 * of the member are written and let go.
 */
export interface SeedUserRef {
  id: number
  gradidoId: string
  communityUuid: string
  name: string
}

/** The rows of one batch of seed users. */
export interface SeedUserRows {
  users: SeedUserRow[]
  userContacts: UserContactInsert[]
  userRoles: UserRoleInsert[]
  userAliases: UserAliasInsert[]
  // only the members whose address is in `referencedEmails`
  refsByEmail: Map<string, SeedUserRef>
}

/**
 * The rows createUser, createUserContact, createUserRole and createUserAlias write, for one
 * batch of users and without touching the database. The ids count from `firstId` in the order
 * of `users`. For the members whose address is in `referencedEmails` it hands back a
 * SeedUserRef, so the caller keeps only what later rows refer to.
 *
 * ⚠️ For an empty database only: the address of a member gets the same id as the member.
 * `users.email_id` and `user_contacts.user_id` point at each other, so both have to be known
 * before either row is written.
 */
export function buildSeedUserRows(
  users: UserInterface[],
  firstId: number,
  communityUuid: string,
  referencedEmails: ReadonlySet<string>,
): SeedUserRows {
  const rows: SeedUserRows = {
    users: [],
    userContacts: [],
    userRoles: [],
    userAliases: [],
    refsByEmail: new Map(),
  }
  users.forEach((user, index) => {
    const id = firstId + index
    const userRow: SeedUserRow = {
      id,
      emailId: id,
      gradidoId: user.gradidoId ?? v4(),
      communityUuid,
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      language: user.language ?? 'en',
      createdAt: user.createdAt ?? new Date(),
      deletedAt: user.deletedAt ?? null,
      accountState: user.deletedAt
        ? AccountState.DELETED
        : user.emailChecked
          ? AccountState.ACTIVATED
          : AccountState.REGISTERED,
      publisherId: user.publisherId ?? 0,
      humhubAllowed: true,
      alias: user.alias,
    }
    rows.userAliases.push({ userId: id, alias: user.alias, origin: ALIAS_ORIGIN_ADOPTED })
    if (user.emailChecked) {
      userRow.passwordEncryptionType = PasswordEncryptionType.GRADIDO_ID
    }
    rows.users.push(userRow)

    const contactRow: UserContactInsert = {
      id,
      userId: id,
      email: user.email ?? '',
      type: UserContactType.USER_CONTACT_EMAIL,
    }
    if (user.createdAt) {
      contactRow.createdAt = user.createdAt
      contactRow.updatedAt = user.createdAt
    }
    if (user.emailChecked) {
      contactRow.emailVerificationCode = random(64)
      contactRow.emailOptInTypeId = OptInType.EMAIL_OPT_IN_REGISTER
      contactRow.emailChecked = true
    }
    rows.userContacts.push(contactRow)

    const role = user.role as RoleNames
    if (role === RoleNames.ADMIN || role === RoleNames.MODERATOR) {
      rows.userRoles.push({ userId: id, role })
    }
    if (user.email && referencedEmails.has(user.email)) {
      rows.refsByEmail.set(user.email, {
        id,
        gradidoId: userRow.gradidoId,
        communityUuid,
        name: fullName(user.firstName ?? '', user.lastName ?? ''),
      })
    }
  })
  return rows
}

/** Writes what buildSeedUserRows built. One after the other: a transaction is one connection. */
export async function insertSeedUserRows(
  rows: SeedUserRows,
  tx: DrizzleTransaction,
): Promise<void> {
  await dbInsertUsers(rows.users, tx)
  await dbInsertUserContacts(rows.userContacts, tx)
  await dbInsertUserRoles(rows.userRoles, tx)
  await dbInsertUserAliases(rows.userAliases, tx)
}
