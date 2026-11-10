// AI-GENERATED — not an architecture reference
import random from 'random-bigint'
import {
  fullName,
  MissingHomeCommunityError,
  OptInType,
  PasswordEncryptionType,
  Result,
  UserContactType,
} from 'shared'
import { v4 } from 'uuid'
import { DrizzleTransaction, drizzleDb } from '../../AppDatabase'
import { DbUser } from '../../data/relations'
import { ALIAS_ORIGIN_ADOPTED, Community, User } from '../../entity'
import { AccountState } from '../../enum/AccountState'
import { RoleNames } from '../../enum/RoleNames'
import { dbSelectHomeCommunity } from '../../queries/communities'
import {
  dbFindUserWithContactById,
  dbInsertUser,
  dbInsertUsers,
  dbUpdateUserEmailId,
} from '../../queries/user'
import { dbInsertUserAlias, dbInsertUserAliases } from '../../queries/userAliases'
import { dbInsertUserContact, dbInsertUserContacts } from '../../queries/userContacts'
import { dbInsertUserRoles } from '../../queries/userRoles'
import {
  UserAliasInsert,
  UserContactInsert,
  UserInsert,
  UserRoleInsert,
} from '../../schemas/drizzle.schema'
import { UserInterface } from '../users/UserInterface'

/** A member as userFactoryDrizzle hands them back: the row, with their address. */
// TODO: remove unnecessary abstraction

/**
 * One member with their address, their name and, if they have one, their role - written in one
 * transaction. The `users` and `user_contacts` rows point at each other, so the first is written
 * without its address and gets it afterwards.
 *
 * @param homeCommunity if left out, the one in the database
 */
export async function userFactoryDrizzle(
  user: UserInterface,
  homeCommunity?: Pick<Community, 'communityUuid'> | null,
): Promise<DbUser> {
  const communityUuid = (homeCommunity ?? (await dbSelectHomeCommunity()))?.communityUuid
  if (!communityUuid) {
    throw new MissingHomeCommunityError()
  }
  return drizzleDb().transaction(async (tx) => {
    const userId = valueOrThrow(await dbInsertUser(userRowOf(user, communityUuid), tx))
    const contactId = valueOrThrow(await dbInsertUserContact(userContactRowOf(user, userId), tx))
    await dbUpdateUserEmailId(userId, contactId, tx)
    valueOrThrow(await dbInsertUserAlias(userAliasRowOf(user, userId), tx))
    const role = userRoleOf(user)
    if (role) {
      await dbInsertUserRoles([{ userId, role }], tx)
    }
    const written = await dbFindUserWithContactById(userId, true, tx)
    if (!written) {
      throw new Error(`user ${userId} was just written and cannot be read`)
    }
    return written
  })
}

/** userFactoryDrizzle for the tests that still work on the entity, with the relations they read. */
export async function userFactory(
  user: UserInterface,
  homeCommunity?: Pick<Community, 'communityUuid'> | null,
): Promise<User> {
  const { id } = await userFactoryDrizzle(user, homeCommunity)
  return User.findOneOrFail({
    where: { id },
    // without a role the entity has no `userRole` at all: what findUserByIdentifier hands back
    relations: { emailContact: true, community: true, userRole: userRoleOf(user) !== null },
    withDeleted: true,
  })
}

// a row a seed cannot write is a bug in the seed
function valueOrThrow<T>(result: Result<T, Error>): T {
  if (!result.success) {
    throw result.error
  }
  return result.value
}

function userRowOf(user: UserInterface, communityUuid: string): UserInsert & { gradidoId: string } {
  const defaultAccountState = user.deletedAt
    ? AccountState.DELETED
    : user.emailChecked
      ? AccountState.ACTIVATED
      : AccountState.REGISTERED
  const row: UserInsert & { gradidoId: string } = {
    gradidoId: user.gradidoId ?? v4(),
    communityUuid,
    firstName: user.firstName ?? '',
    lastName: user.lastName ?? '',
    language: user.language ?? 'en',
    createdAt: user.createdAt ?? new Date(),
    deletedAt: user.deletedAt ?? null,
    accountState: user.accountState ? user.accountState : defaultAccountState,
    publisherId: user.publisherId ?? 0,
    humhubAllowed: true,
    alias: user.alias,
    referrerId: user.referrerId,
  }
  if (user.emailChecked || user.password) {
    row.passwordEncryptionType = PasswordEncryptionType.GRADIDO_ID
  }
  return row
}

function userContactRowOf(user: UserInterface, userId: number): UserContactInsert {
  const row: UserContactInsert = {
    userId,
    email: user.email ?? '',
    type: UserContactType.USER_CONTACT_EMAIL,
  }
  if (user.createdAt) {
    row.createdAt = user.createdAt
    row.updatedAt = user.createdAt
  }
  if (user.emailChecked) {
    row.emailVerificationCode = random(64)
    row.emailOptInTypeId = OptInType.EMAIL_OPT_IN_REGISTER
    row.emailChecked = true
  }
  return row
}

// Every alias a member holds has its row in `user_aliases`, as registration and migration
// 0116 write it. `adopted`: a name that is already settled, and costs none of the four picks.
function userAliasRowOf(user: UserInterface, userId: number): UserAliasInsert {
  return { userId, alias: user.alias, origin: ALIAS_ORIGIN_ADOPTED }
}

function userRoleOf(user: UserInterface): RoleNames | null {
  const role = user.role as RoleNames
  return role === RoleNames.ADMIN || role === RoleNames.MODERATOR ? role : null
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

export function seedUserRefOf(user: User): SeedUserRef {
  return {
    id: user.id,
    gradidoId: user.gradidoID,
    communityUuid: user.communityUuid,
    name: fullName(user.firstName, user.lastName),
  }
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
    const userRow: SeedUserRow = { ...userRowOf(user, communityUuid), id, emailId: id }
    rows.users.push(userRow)
    rows.userAliases.push(userAliasRowOf(user, id))
    rows.userContacts.push({ ...userContactRowOf(user, id), id })

    const role = userRoleOf(user)
    if (role) {
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
