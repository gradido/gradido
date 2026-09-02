// AI-GENERATED — not an architecture reference
import { Contact } from '@model/Contact'
import { ContactList } from '@model/ContactList'
import { MemberRef } from '@model/MemberRef'
import { User } from '@model/User'
import {
  ContactRow,
  dbDeleteFavorite,
  dbFindMemberAvatarTimestamps,
  dbInsertFavorite,
  dbSelectContactsByUserId,
  dbSelectFavoritesByUserId,
  User as dbUser,
  getHomeCommunity,
} from 'database'
import { getLogger } from 'log4js'
import { Arg, Authorized, Ctx, Int, Mutation, Query, Resolver } from 'type-graphql'
import { In } from 'typeorm'
import { RIGHTS } from '@/auth/RIGHTS'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { MemberRefInput } from '@/graphql/input/MemberRefInput'
import { Context, getUser } from '@/server/context'
import { LogError } from '@/server/LogError'
import { remoteUserFromBooking } from './util/counterparty'

const createLogger = () =>
  getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.graphql.resolver.ContactResolver`)

/** The stored form of a favourite: community uuid and gradido id, as one key. */
const favoriteKey = (communityUuid: string, gradidoID: string): string =>
  `${communityUuid}/${gradidoID}`

/**
 * The community uuid a favourite is stored under.
 *
 * A member of this community who registered before it had a uuid carries none on their
 * row, and a booking with them carries none either; the wallet then sends null. The home
 * community's uuid stands in -- the same substitution the member-avatar key makes -- so
 * that one person is one key however old their account is.
 */
const resolveCommunityUuid = async (communityUuid: string | null | undefined): Promise<string> => {
  if (communityUuid) {
    return communityUuid
  }
  const home = await getHomeCommunity()
  if (!home?.communityUuid) {
    throw new LogError('Home community has no uuid, cannot address a member without one')
  }
  return home.communityUuid
}

@Resolver()
export class ContactResolver {
  /**
   * Everyone the caller has exchanged Gradido with -- a view on their own bookings, each
   * person once, newest first. Not a table: see dbSelectContactsByUserId.
   *
   * Every user in the answer is the same `User` model the booking row carries, so the
   * wallet reads the list by the fields it already knows. And by the same rule: nothing
   * here sets firstName or lastName for anybody but through the guarded path the booking
   * list uses (NU-019).
   */
  @Authorized([RIGHTS.MANAGE_OWN_CONTACTS])
  @Query(() => ContactList)
  async contactList(
    @Ctx() context: Context,
    @Arg('currentPage', () => Int, { defaultValue: 1 }) currentPage: number,
    @Arg('pageSize', () => Int, { defaultValue: 25 }) pageSize: number,
    @Arg('search', () => String, { nullable: true }) search?: string | null,
  ): Promise<ContactList> {
    const user = getUser(context)
    const logger = createLogger()
    logger.addContext('user', user.id)
    if (currentPage < 1 || pageSize < 1) {
      throw new LogError('contactList: page and page size must be positive', currentPage, pageSize)
    }

    const page = await dbSelectContactsByUserId(user.id, {
      search: search ?? undefined,
      limit: pageSize,
      offset: (currentPage - 1) * pageSize,
    })

    const home = await getHomeCommunity()
    const homeUuid = home?.communityUuid ?? null
    const favorites = new Set(
      (await dbSelectFavoritesByUserId(user.id)).map((row) =>
        favoriteKey(row.favoriteCommunityUuid, row.favoriteGradidoId),
      ),
    )

    // Members of this community come from their users row -- deleted ones included, the
    // booking is the caller's own record and keeps naming them (AS-009 leaves them the
    // name and takes the picture) -- with the date of their picture in one batch, the way
    // the booking list does it.
    const localIds = page.contacts
      .map((row) => row.linkedUserId)
      .filter((id): id is number => id !== null)
    const localUsers = new Map<number, User>()
    if (localIds.length > 0) {
      const rows = await dbUser.find({ where: { id: In(localIds) }, withDeleted: true })
      const avatarDates = await dbFindMemberAvatarTimestamps(localIds)
      for (const row of rows) {
        const model = new User(row)
        model.avatarUpdatedAt = avatarDates.get(row.id) ?? null
        // The booking row gets the community name from the users->community relation,
        // which is not loaded here; a member of this community is in the home community.
        model.communityName = home?.name ?? null
        localUsers.set(row.id, model)
      }
    }

    const contacts: Contact[] = []
    for (const row of page.contacts) {
      const model = await this.userForContact(row, localUsers, logger)
      if (!model) {
        continue
      }
      const key = favoriteKey(model.communityUuid ?? homeUuid ?? '', model.gradidoID)
      contacts.push(new Contact(model, row.firstAt, row.lastAt, row.bookings, favorites.has(key)))
    }
    return new ContactList(contacts, page.count)
  }

  private async userForContact(
    row: ContactRow,
    localUsers: Map<number, User>,
    logger: ReturnType<typeof createLogger>,
  ): Promise<User | null> {
    if (row.linkedUserId !== null) {
      const model = localUsers.get(row.linkedUserId)
      if (!model) {
        // A users row that the join found a moment ago cannot be gone; log, skip, carry on.
        logger.warn(`contact with linked user ${row.linkedUserId} vanished between two reads`)
        return null
      }
      return model
    }
    return remoteUserFromBooking(
      {
        linkedUserCommunityUuid: row.communityUuid,
        linkedUserGradidoID: row.gradidoId,
        linkedUserName: row.alias,
      },
      logger,
      `contact ${row.communityUuid}/${row.gradidoId}`,
    )
  }

  /**
   * The caller's hearts, as pairs -- small enough to be fetched once per session and held
   * beside the booking list, which is why `transactionList` needs no field for it.
   */
  @Authorized([RIGHTS.MANAGE_OWN_CONTACTS])
  @Query(() => [MemberRef])
  async favoriteList(@Ctx() context: Context): Promise<MemberRef[]> {
    const user = getUser(context)
    const rows = await dbSelectFavoritesByUserId(user.id)
    return rows.map((row) => new MemberRef(row.favoriteCommunityUuid, row.favoriteGradidoId))
  }

  /**
   * Gives the heart. Twice is the same heart, not an error (a double tap on a phone).
   *
   * Not checked against the booking list on purpose: a heart on somebody the caller has
   * no booking with is a row nobody ever sees -- the contact list is built from bookings,
   * and the favourites in it are the contacts that carry a heart. Private and silent
   * either way; the person marked is never told.
   */
  @Authorized([RIGHTS.MANAGE_OWN_CONTACTS])
  @Mutation(() => Boolean)
  async addFavorite(
    @Arg('ref', () => MemberRefInput) ref: MemberRefInput,
    @Ctx() context: Context,
  ): Promise<boolean> {
    const user = getUser(context)
    const communityUuid = await resolveCommunityUuid(ref.communityUuid)
    if (ref.gradidoID === user.gradidoID) {
      throw new LogError('A member cannot be their own favorite', user.id)
    }
    await dbInsertFavorite({
      userId: user.id,
      favoriteCommunityUuid: communityUuid,
      favoriteGradidoId: ref.gradidoID,
    })
    return true
  }

  /** Takes the heart away. `false` when there was none -- two taps, one row, no error. */
  @Authorized([RIGHTS.MANAGE_OWN_CONTACTS])
  @Mutation(() => Boolean)
  async removeFavorite(
    @Arg('ref', () => MemberRefInput) ref: MemberRefInput,
    @Ctx() context: Context,
  ): Promise<boolean> {
    const user = getUser(context)
    const communityUuid = await resolveCommunityUuid(ref.communityUuid)
    const result = await dbDeleteFavorite(user.id, { communityUuid, gradidoId: ref.gradidoID })
    return result.success
  }
}
