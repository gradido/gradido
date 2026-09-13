// functions copied over from there previous positions, step in refactoring
// legacy code, not a architecture reference

import { getLogger } from 'log4js'
import { aliasSchema, emailSchema, Order, Result, uuidv4Schema, VoidResult } from 'shared'
import { EntityManager, In, IsNull, Like, Not, Raw } from 'typeorm'
import { User as DbUser, UserContact as DbUserContact } from '../entity'
import { RoleNames } from '../enum'
import { DBNotFoundError } from '../errorTypes'
import { findWithCommunityIdentifier, LOG4JS_QUERIES_CATEGORY_NAME } from './index'
import { dbFindAliasOwner } from './userAliases'
import { dbFindUserIdsByEmailLike } from './userContacts'

/*
 * The TypeORM queries that select `from users`: the ones not yet translated to Drizzle, and
 * the ones that stay on TypeORM for now because they join a TypeORM transaction (see
 * `dbSetCreationAllowed`). Once one is translated it moves to `./user`, which holds only
 * Drizzle queries.
 *
 * The ones from `./user` come first. Those after them were collected from the backend -
 * step one of the query migration AGENTS.md describes, and step one only: moved, still
 * TypeORM, same options, same result.
 */

/**
 * ⚠️ Pass `manager` from inside a transaction. Without it this reads over its own
 * connection, so a caller that holds the member's row under `SELECT ... FOR UPDATE` and
 * then saves what it read here would be writing an entity it loaded from beside its own
 * transaction rather than from within it.
 *
 * Renamed from `getUserById` for AGENTS.md's `db…` rule, because this delivery touched it.
 * Five executing functions still carry no prefix - three in this file
 * (`findForeignUserByUuids`, `findUserByUuids`, `findUserByIdentifier`), two in `./user`
 * (`aliasExists`, `findUserNamesByIds`) - together 68 call sites against this one's 6, so
 * they are their own mechanical change and not this one's. Until they follow, the files have
 * two conventions and this note is the only thing saying which way it is going.
 */
export async function dbGetUserById(
  id: number,
  withCommunity: boolean = false,
  withEmailContact: boolean = false,
  manager?: EntityManager,
): Promise<DbUser> {
  const options = {
    where: { id },
    relations: { community: withCommunity, emailContact: withEmailContact },
  }
  return manager ? manager.findOneOrFail(DbUser, options) : DbUser.findOneOrFail(options)
}

/**
 * A user together with the role row that isAuthorized reads for the logged-in person -
 * for somebody who is NOT logged in but acts through a stored id, the first-creation
 * signer. Deleted accounts come back too (`withDeleted`): the caller decides what a
 * deleted signer means, and "not found" would hide that it was ever somebody.
 *
 * Not found IS an expected outcome here: the stored id may point at an account that has
 * since been removed for good.
 */
export async function dbGetUserWithRoleById(id: number): Promise<Result<DbUser, DBNotFoundError>> {
  const user = await DbUser.findOne({
    where: { id },
    withDeleted: true,
    relations: { userRole: true, emailContact: true },
  })
  return user
    ? { success: true, value: user }
    : { success: false, error: new DBNotFoundError('users', `id = ${id}`) }
}

/**
 *
 * @param identifier could be gradidoID, alias or email of user
 * @param communityIdentifier could be uuid or name of community
 * @returns
 */
export const findUserByIdentifier = async (
  identifier: string,
  communityIdentifier?: string,
): Promise<DbUser | null> => {
  const communityWhere = communityIdentifier
    ? findWithCommunityIdentifier(communityIdentifier)
    : undefined

  if (uuidv4Schema.safeParse(identifier).success) {
    return DbUser.findOne({
      where: { gradidoID: identifier, community: communityWhere },
      relations: ['emailContact', 'community'],
    })
  } else if (emailSchema.safeParse(identifier).success) {
    const userContact = await DbUserContact.findOne({
      where: {
        email: identifier,
        emailChecked: true,
        user: {
          community: communityWhere,
        },
      },
      relations: { user: { community: true } },
    })
    if (userContact) {
      // `UserContact.user` is the inverse of `users.email_id`, so it is EMPTY for every row
      // that is not the address currently in force - and since the e-mail change a member
      // keeps a confirmed row for every address they ever held. `emailChecked` does not tell
      // the two apart: an address one gave up stays checked. Without this guard the query
      // returned such an orphaned row (the relation condition is a LEFT JOIN, and an absent
      // community identifier adds no condition at all) and the next line wrote to null.
      //
      // Answering "not found" is what `findUserByEmail` does with the same input, so the two
      // ways of asking agree. Whether a FORMER address should still lead to its owner - the
      // way a former alias does further down - is a product question, not this one's to
      // settle.
      if (!userContact.user) {
        return null
      }
      // TODO: remove circular reference
      const user = userContact.user
      user.emailContact = userContact
      return user
    }
  } else if (aliasSchema.safeParse(identifier).success) {
    const normedAlias = Raw((a) => `LOWER(${a}) = LOWER(:alias)`, { alias: identifier })
    const foundUser = await DbUser.findOne({
      where: { alias: normedAlias, community: communityWhere },
      relations: ['emailContact', 'community'],
    })
    if (foundUser !== null) {
      return foundUser
    }
    // Not a current name - but an earlier one still leads to its owner, which is what
    // keeps a printed card working after a rename. Looking the row up by alias alone
    // avoids the community identifier here: it may be a name rather than a uuid, and
    // only local members have rows at all.
    const owner = await dbFindAliasOwner(identifier)
    if (owner) {
      return DbUser.findOne({
        where: { id: owner.userId, community: communityWhere },
        relations: ['emailContact', 'community'],
      })
    }
  } else {
    // should don't happen often, so we create only in the rare case a logger for it
    getLogger(`${LOG4JS_QUERIES_CATEGORY_NAME}.user.findUserByIdentifier`).warn(
      'Unknown identifier type',
      identifier,
    )
  }
  return null
}

/**
 * The `users` row the federation stored for a member of another community, by the pair.
 *
 * `communityUuid` may be null: a booking row carries none when the other community had no
 * uuid yet, and the lookup then goes by the gradido id alone -- spelled out, because TypeORM
 * would otherwise drop an `undefined` from the `where` silently and the reader could not
 * tell the two lookups apart.
 */
export async function findForeignUserByUuids(
  communityUuid: string | null,
  gradidoID: string,
): Promise<DbUser | null> {
  return DbUser.findOne({
    where:
      communityUuid === null
        ? { foreign: true, gradidoID }
        : { foreign: true, communityUuid, gradidoID },
  })
}

/**
 * Every `users` row the federation stored for members of other communities with one of
 * these gradido ids -- one query for a whole page of contacts, where one per contact would
 * be one round trip per person. The caller matches the pair; here it is the id alone,
 * because a uuid is unique for every practical purpose and the caller's pair check is
 * the second lock.
 */
export async function dbFindForeignUsersByGradidoIds(gradidoIds: string[]): Promise<DbUser[]> {
  if (gradidoIds.length === 0) {
    return []
  }
  return DbUser.find({ where: { foreign: true, gradidoID: In(gradidoIds) } })
}

/**
 * The `users` rows for a set of ids, in one query -- how a list resolves its local
 * counterparties. `withDeleted`: a booking keeps naming a member whose account is gone
 * (AS-009 leaves them the name and takes the picture), so the lists pass true.
 *
 * TypeORM as it was in the resolvers (AGENTS.md, step 1: move); translated with the rest
 * of this file.
 */
export async function dbFindUsersByIds(
  userIds: number[],
  options: { withDeleted?: boolean } = {},
): Promise<DbUser[]> {
  if (userIds.length === 0) {
    return []
  }
  return DbUser.find({ where: { id: In(userIds) }, withDeleted: options.withDeleted ?? false })
}

export async function findUserByUuids(
  communityUuid: string,
  gradidoID: string,
  foreign: boolean = false,
): Promise<DbUser | null> {
  return DbUser.findOne({
    where: { foreign, communityUuid, gradidoID },
    relations: ['emailContact'],
  })
}

/**
 * ES-021: switch an account between "person, may create" and "project account, may not".
 * This one column and nothing else — the callers hold a request-context snapshot of the
 * member, and a full `save()` would write every stale column back (see dbUpdateUserPassword).
 *
 * TypeORM rather than Drizzle, on purpose: the declaration writes this column AND an event
 * row, and the two must land together or not at all. The events live in TypeORM, one
 * transaction covers one ORM only (AGENTS.md), so this write joins the event's side. Pass
 * `manager` from inside that transaction.
 *
 * Writing the value the row already holds is a success: mysql2 connects with FOUND_ROWS,
 * so `affected` counts the matched row, not a changed one — dbClearGmsRegistration
 * (`./user`) relies on the same thing.
 */
export async function dbSetCreationAllowed(
  userId: number,
  allowed: boolean,
  manager?: EntityManager,
): Promise<VoidResult<DBNotFoundError>> {
  const result = manager
    ? await manager.update(DbUser, { id: userId }, { creationAllowed: allowed })
    : await DbUser.update({ id: userId }, { creationAllowed: allowed })
  if (result.affected === 1) {
    return { success: true }
  }
  return { success: false, error: new DBNotFoundError('users', `id = ${userId}`) }
}

/** Persist a member - inside the caller's transaction when given. */
export async function dbSaveUser(user: DbUser, manager?: EntityManager): Promise<DbUser> {
  return manager ? manager.save(user) : DbUser.save(user)
}

/**
 * Re-key the stored password: exactly these two columns, nothing else. Callers hold a
 * request-context snapshot that may be minutes old, and a full entity `save()` diffs
 * against the row as of NOW - it would write every stale column back, `users.email_id`
 * above all, undoing whatever committed in between.
 */
export async function dbUpdateUserPassword(
  userId: number,
  password: DbUser['password'],
  passwordEncryptionType: DbUser['passwordEncryptionType'],
): Promise<void> {
  await DbUser.update({ id: userId }, { password, passwordEncryptionType })
}

/**
 * Holds the member's row under a write lock for the rest of the caller's transaction -
 * the plain way to run "look, then change" for one member without a second request
 * slipping in between (the e-mail change: one pending change, one mail per window).
 * Returns nothing; the caller already holds the member.
 */
export async function dbLockUserRow(userId: number, manager: EntityManager): Promise<void> {
  await manager.findOne(DbUser, { where: { id: userId }, lock: { mode: 'pessimistic_write' } })
}

/** Moved from `backend/src/apis/gms/ExportUsers.ts`. */
export async function dbFindUsersWithEmailContactByIds(ids: number[]): Promise<DbUser[]> {
  return DbUser.find({
    where: { id: In(ids) },
    relations: ['emailContact'],
  })
}

/**
 * One page of the members who have an e-mail address, with that address, and the count
 * of all of them. Moved from `backend/src/apis/humhub/ExportUsers.ts`.
 *
 * Ordered by id: pages are only pages over a fixed order. TypeORM happened to page by id
 * anyway - with joins it fetches the page's ids first and appends the primary key to that
 * query's order - but it said nothing about the rows within a page, and it stops doing even
 * that the day the relation goes.
 */
export async function dbFindUsersWithEmailContactPage(
  page: number,
  limit: number,
): Promise<[DbUser[], number]> {
  return DbUser.findAndCount({
    relations: { emailContact: true },
    order: { id: Order.ASC },
    skip: page * limit,
    take: limit,
    where: { emailContact: { email: Not(IsNull()) } },
  })
}

/**
 * One page of the admins and moderators, with their roles, and the count of all of them.
 * Moved from `searchAdminUsers` in `backend/src/graphql/resolver/UserResolver.ts`.
 *
 * By `createdAt`, and among equal ones by id in the same direction - see
 * `dbFindUsersWithEmailContactPage` for what TypeORM did without it.
 */
export async function dbFindAdminUsersPage(
  currentPage: number,
  pageSize: number,
  order: Order,
): Promise<[DbUser[], number]> {
  // MODERATOR_AI belongs here too: a KI-Moderator is a moderator who may additionally use
  // Crea, so leaving the role out would drop real moderators from the community info page
  // and leave their groups without a contact.
  return DbUser.findAndCount({
    relations: ['userRole'],
    where: {
      userRole: { role: In([RoleNames.ADMIN, RoleNames.MODERATOR, RoleNames.MODERATOR_AI]) },
    },
    order: {
      createdAt: order,
      id: order,
    },
    skip: (currentPage - 1) * pageSize,
    take: pageSize,
  })
}

/**
 * The member whose CURRENT address this is, deleted accounts included, with role and
 * address. Throws TypeORM's `EntityNotFoundError` when there is none - the caller
 * (`findUserByEmail` in `backend/src/graphql/resolver/UserResolver.ts`, where this was
 * moved from) catches exactly that.
 */
export async function dbFindUserByEmailOrFail(email: string): Promise<DbUser> {
  return DbUser.findOneOrFail({
    where: {
      emailContact: { email },
    },
    withDeleted: true,
    relations: { userRole: true, emailContact: true },
  })
}

type SearchUsersFilters = {
  byActivated?: boolean | null
  byDeleted?: boolean | null
}

function likeQuery(searchCriteria: string) {
  return Like(`%${searchCriteria}%`)
}

function emailCheckedQuery(filters: SearchUsersFilters) {
  return filters.byActivated ?? undefined
}

function deletedAtQuery(filters: SearchUsersFilters | null) {
  return filters?.byDeleted !== undefined && filters?.byDeleted !== null
    ? filters.byDeleted
      ? Not(IsNull())
      : IsNull()
    : undefined
}

/**
 * The admin's member search: first name, last name or any address a member ever had.
 * Moved from `backend/src/graphql/resolver/util/findUsers.ts`.
 */
export const dbFindUsers = async (
  select: string[],
  searchCriteria: string,
  filters: SearchUsersFilters | null,
  currentPage: number,
  pageSize: number,
  order = Order.ASC,
): Promise<[DbUser[], number]> => {
  // Every address a member ever had, not only the current one: somebody arriving from the
  // GDT server holds the address that was first - which may well be one the member has
  // since changed. An empty search already matches everybody through the name branches.
  const idsByAnyEmail = searchCriteria ? await dbFindUserIdsByEmailLike(searchCriteria) : []
  const where = [
    {
      firstName: likeQuery(searchCriteria),
      deletedAt: deletedAtQuery(filters),
      emailContact: filters
        ? {
            emailChecked: emailCheckedQuery(filters),
          }
        : undefined,
    },
    {
      lastName: likeQuery(searchCriteria),
      deletedAt: deletedAtQuery(filters),
      emailContact: filters
        ? {
            emailChecked: emailCheckedQuery(filters),
          }
        : undefined,
    },
    // The "activated" filter still reads the current address.
    ...(idsByAnyEmail.length > 0
      ? [
          {
            id: In(idsByAnyEmail),
            deletedAt: deletedAtQuery(filters),
            emailContact: filters
              ? {
                  emailChecked: emailCheckedQuery(filters),
                }
              : undefined,
          },
        ]
      : []),
  ]
  const selectFind = Object.fromEntries(select.map((item) => [item, true]))
  const relations = ['emailContact', 'userRole']
  const orderFind = {
    id: order,
  }
  const take = pageSize
  const skip = (currentPage - 1) * pageSize
  const withDeleted = true

  const [users, count] = await DbUser.findAndCount({
    where,
    withDeleted,
    select: selectFind,
    relations,
    order: orderFind,
    take,
    skip,
  })
  return [users, count]
}
