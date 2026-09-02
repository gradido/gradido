// AI-GENERATED — not an architecture reference
import { Paginated } from '@arg/Paginated'
import { MemberAvatarRefInput } from '@input/MemberAvatarRefInput'
import { Contact } from '@model/Contact'
import { ContactList } from '@model/ContactList'
import { MemberRef } from '@model/MemberRef'
import { User } from '@model/User'
import {
  ContactRow,
  dbDeleteFavorite,
  dbFindForeignUsersByGradidoIds,
  dbFindMemberAvatarTimestamps,
  dbFindUsersByIds,
  dbInsertFavorite,
  dbSelectContactsByUserId,
  dbSelectFavoritesByUserId,
  getHomeCommunity,
} from 'database'
import { getLogger } from 'log4js'
import { Arg, Args, Authorized, Ctx, Mutation, Query, Resolver } from 'type-graphql'
import { RIGHTS } from '@/auth/RIGHTS'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { Context, getUser } from '@/server/context'
import { LogError } from '@/server/LogError'
import { getCommunityName } from './util/communities'
import { CounterpartyLookups, remoteUserFromBooking } from './util/counterparty'

const createLogger = () =>
  getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.graphql.resolver.ContactResolver`)

/** The stored form of a favourite: community uuid and gradido id, as one key. */
const favoriteKey = (communityUuid: string, gradidoID: string): string =>
  `${communityUuid}/${gradidoID}`

/**
 * The community uuid a favourite is stored under.
 *
 * A member of this community who registered before it had a uuid carries none on their
 * row; the home community's uuid stands in -- the same substitution contactList makes
 * when it builds the model -- so that one person is one key however old their account is.
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
    @Args() { currentPage = 1, pageSize = 25 }: Paginated,
    @Arg('search', () => String, { nullable: true }) search: string | null,
    @Ctx() context: Context,
  ): Promise<ContactList> {
    const user = getUser(context)
    const logger = createLogger()
    logger.addContext('user', user.id)

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
      const rows = await dbFindUsersByIds(localIds, { withDeleted: true })
      const avatarDates = await dbFindMemberAvatarTimestamps(localIds)
      for (const row of rows) {
        const model = new User(row)
        model.avatarUpdatedAt = avatarDates.get(row.id) ?? null
        // A member whose users row predates the home community's uuid carries none. The
        // home community stands in -- ONCE, here, where the model is built: the GraphQL
        // field is non-null, the favourite is stored under that uuid, and the wallet keys
        // the heart by it. One pair per person, and no layer downstream needs a fallback.
        if (!model.communityUuid && homeUuid) {
          model.communityUuid = homeUuid
        }
        // The booking list leaves communityName empty for a member of this community (it
        // loads no community relation). The contact row shows the community, as the
        // mockup does, in a line of its own -- so the name is set here, and the row keeps
        // it out of the name link (ContactRow.vue).
        model.communityName = home?.name ?? null
        localUsers.set(row.id, model)
      }
    }

    const lookups = await this.remoteLookups(
      page.contacts.filter((row) => row.linkedUserId === null),
    )

    const contacts: Contact[] = []
    for (const row of page.contacts) {
      const model = await this.userForContact(row, localUsers, lookups, logger)
      if (!model) {
        continue
      }
      const key = favoriteKey(model.communityUuid ?? homeUuid ?? '', model.gradidoID)
      contacts.push(new Contact(model, row.firstAt, row.lastAt, row.bookings, favorites.has(key)))
    }
    return new ContactList(contacts, page.count)
  }

  /**
   * The foreign counterparties of one page, looked up in one users query and one
   * community lookup per community -- instead of two queries per contact. The wallet asks
   * for the whole list at once, so a member with many cross-community contacts would
   * otherwise pay hundreds of round trips for one page.
   */
  private async remoteLookups(remoteRows: ContactRow[]): Promise<CounterpartyLookups> {
    const gradidoIds = [...new Set(remoteRows.map((row) => row.gradidoId))]
    const foreignUsers = await dbFindForeignUsersByGradidoIds(gradidoIds)
    const communityNames = new Map<string, Promise<string>>()
    return {
      findForeignUser: async (communityUuid, gradidoID) =>
        foreignUsers.find(
          (row) =>
            row.gradidoID === gradidoID &&
            (communityUuid === null || row.communityUuid === communityUuid),
        ) ?? null,
      communityName: (communityUuid) => {
        let name = communityNames.get(communityUuid)
        if (!name) {
          name = getCommunityName(communityUuid)
          communityNames.set(communityUuid, name)
        }
        return name
      },
    }
  }

  private async userForContact(
    row: ContactRow,
    localUsers: Map<number, User>,
    lookups: CounterpartyLookups,
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
        // Already null when the stored name cannot be an alias (dbSelectContactsByUserId);
        // the helper's own guard is the second lock.
        linkedUserName: row.alias,
      },
      logger,
      `contact ${row.communityUuid}/${row.gradidoId}`,
      lookups,
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
    @Arg('ref', () => MemberAvatarRefInput) ref: MemberAvatarRefInput,
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
    @Arg('ref', () => MemberAvatarRefInput) ref: MemberAvatarRefInput,
    @Ctx() context: Context,
  ): Promise<boolean> {
    const user = getUser(context)
    const communityUuid = await resolveCommunityUuid(ref.communityUuid)
    const result = await dbDeleteFavorite(user.id, { communityUuid, gradidoId: ref.gradidoID })
    return result.success
  }
}
