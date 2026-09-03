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
import { isSameCommunity } from '@/data/Community.logic'
import { Context, getUser } from '@/server/context'
import { LogError } from '@/server/LogError'
import { CounterpartyLookups, prefetchedLookups, remoteUserFromBooking } from './util/counterparty'

const createLogger = () =>
  getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.graphql.resolver.ContactResolver`)

/** The stored form of a favourite: community uuid and gradido id, as one key. */
const favoriteKey = (communityUuid: string, gradidoID: string): string =>
  `${communityUuid}/${gradidoID}`

/**
 * The community uuid a favourite is stored under.
 *
 * The wallet passes on what the booking gave it, and that may be nothing: a member of this
 * community whose `users` row predates the home community's uuid carries none. Migration
 * 0129 fills those rows, so this is the belt rather than the braces -- and it is also what
 * answers a wallet that is older than the migration.
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
   *
   * ⚠️ The page arguments are the house `Paginated`, so the SCHEMA defaults are the ones
   * that class carries -- page 1, size 3, newest first -- not the wallet's 25. Every
   * caller states its own size; the seed and wallet documents declare theirs.
   */
  @Authorized([RIGHTS.MANAGE_OWN_CONTACTS])
  @Query(() => ContactList)
  async contactList(
    @Args() { currentPage, pageSize, order }: Paginated,
    @Arg('search', () => String, { nullable: true }) search: string | null,
    @Ctx() context: Context,
  ): Promise<ContactList> {
    const user = getUser(context)
    const logger = createLogger()
    logger.addContext('user', user.id)

    // Two rounds, not six: the page, the home community and the caller's hearts depend on
    // nothing; everything below depends only on the page.
    const [page, home, favoriteRows] = await Promise.all([
      dbSelectContactsByUserId(user.id, {
        search: search ?? undefined,
        limit: pageSize,
        offset: (currentPage - 1) * pageSize,
        order,
      }),
      getHomeCommunity(),
      dbSelectFavoritesByUserId(user.id),
    ])
    const favorites = new Set(
      favoriteRows.map((row) => favoriteKey(row.favoriteCommunityUuid, row.favoriteGradidoId)),
    )

    // Members of this community come from their users row -- deleted ones included, the
    // booking is the caller's own record and keeps naming them (AS-009 leaves them the
    // name and takes the picture) -- with the date of their picture in one batch, the way
    // the booking list does it. The members of other communities are looked up for the
    // whole page at once; one query per person would be one round trip per person.
    const localIds = page.contacts
      .map((row) => row.linkedUserId)
      .filter((id): id is number => id !== null)
    const [localRows, avatarDates, lookups] = await Promise.all([
      dbFindUsersByIds(localIds, { withDeleted: true }),
      dbFindMemberAvatarTimestamps(localIds),
      prefetchedLookups(page.contacts.filter((row) => row.linkedUserId === null)),
    ])

    const localUsers = new Map<number, User>()
    /** Contacts joined from a `users` row that belongs to another community. */
    const foreignLocals: User[] = []
    for (const row of localRows) {
      const model = new User(row)
      model.avatarUpdatedAt = avatarDates.get(row.id) ?? null

      // ⛔ The row's OWN `foreign` column decides, and it decides BEFORE anything is stood
      // in for. A set `linked_user_id` is not proof of belonging here -- the federation
      // stores foreign members as `users` rows too, and the contact query joins on that id
      // without asking. Deciding after the stand-in below would call every such member
      // ours, which is the wrong answer this whole field exists to avoid.
      if (row.foreign) {
        // Their community's real name, not ours and not nothing. The lookup memoises per
        // request, and these rows are rare -- a federated member with a stored row.
        foreignLocals.push(model)
      } else {
        // A row that predates the home community's uuid carries none, and the GraphQL
        // field is non-null. Migration 0129 fills those rows -- it fills `foreign = 0`
        // rows only, which is why this stands inside the local branch and not above it.
        if (!model.communityUuid && home?.communityUuid) {
          model.communityUuid = home.communityUuid
        }
        // The booking list leaves communityName empty for a member of this community (it
        // loads no community relation). The contact row shows the community, as the
        // mockup does, in a line of its own -- so the name is set here, and the row keeps
        // it out of the name link (ContactRow.vue).
        model.communityName = home?.name ?? null
      }
      localUsers.set(row.id, model)
    }
    await Promise.all(
      foreignLocals.map(async (model) => {
        model.communityName = model.communityUuid
          ? await lookups.communityName(model.communityUuid)
          : null
      }),
    )

    const contacts: Contact[] = []
    for (const row of page.contacts) {
      const model = await this.userForContact(row, localUsers, lookups, logger)
      if (!model) {
        continue
      }
      if (!model.communityUuid) {
        // Only a member of another community can still get here: a booking that carries no
        // community uuid and no stored `users` row. `User.communityUuid` is non-null, so
        // delivering them would null the WHOLE answer -- one unnameable contact must not
        // cost the member their contact list.
        logger.warn(`contact ${row.gradidoId} has no community uuid, left out of the list`)
        continue
      }
      const key = favoriteKey(model.communityUuid, model.gradidoID)
      contacts.push(
        new Contact(
          model,
          row.firstAt,
          row.lastAt,
          row.bookings,
          favorites.has(key),
          isSameCommunity(model.communityUuid, home?.communityUuid),
        ),
      )
    }
    return new ContactList(contacts, page.count)
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
