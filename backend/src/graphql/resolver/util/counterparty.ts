// AI-GENERATED — not an architecture reference
import { User } from '@model/User'
import {
  BookingCounterparty,
  User as DbUser,
  dbFindForeignUsersByGradidoIds,
  dbFindUserIdByUuids,
  findForeignUserByUuids,
} from 'database'
import { Logger } from 'log4js'
import { isAliasEraName } from 'shared'
import { LogError } from '@/server/LogError'
import { getCommunityName, resolveCommunityUuid } from './communities'

/** What a booking carries about a counterparty from another community. */
export interface RemoteCounterpartyRef {
  linkedUserCommunityUuid: string | null
  linkedUserGradidoID: string | null
  linkedUserName: string | null
}

/**
 * Where the helper looks things up. The booking list takes the database directly, one
 * row at a time; the contact list hands in a page's worth prefetched in one query, and
 * community names memoised per request -- the rule below stays the same either way.
 */
export interface CounterpartyLookups {
  /** The `users` row the federation stored for the pair, or null. */
  findForeignUser: (communityUuid: string | null, gradidoID: string) => Promise<DbUser | null>
  /** The community's name by its uuid, '' when unknown. */
  communityName: (communityUuid: string) => Promise<string>
}

const dbLookups: CounterpartyLookups = {
  findForeignUser: findForeignUserByUuids,
  communityName: getCommunityName,
}

/** How a member of another community is keyed while a page is being resolved. */
const pairKey = (communityUuid: string | null, gradidoID: string): string =>
  `${communityUuid ?? ''}/${gradidoID}`

/**
 * The same lookups for a WHOLE page, in one users query and one query per community.
 *
 * A list that resolves its foreign counterparties one at a time pays two round trips per
 * person; the contact list asks for every contact at once, so that is unbounded. This
 * prefetches instead -- and lives here, beside `dbLookups`, so that the booking list can
 * take it too without a second pair rule being written somewhere else.
 *
 * @param refs the foreign rows of the page: the uuid pair of each counterparty
 */
export const prefetchedLookups = async (
  refs: { communityUuid: string | null; gradidoId: string }[],
): Promise<CounterpartyLookups> => {
  const foreignUsers = await dbFindForeignUsersByGradidoIds([
    ...new Set(refs.map((ref) => ref.gradidoId)),
  ])
  const byPair = new Map<string, DbUser>()
  const byId = new Map<string, DbUser>()
  for (const row of foreignUsers) {
    byPair.set(pairKey(row.communityUuid, row.gradidoID), row)
    // A booking that carries no community uuid is matched by the id alone, the way
    // findForeignUserByUuids does it; the first row wins there, as findOne would.
    if (!byId.has(row.gradidoID)) {
      byId.set(row.gradidoID, row)
    }
  }
  const communityNames = new Map<string, Promise<string>>()
  return {
    findForeignUser: (communityUuid, gradidoID) =>
      Promise.resolve(
        (communityUuid === null
          ? byId.get(gradidoID)
          : byPair.get(pairKey(communityUuid, gradidoID))) ?? null,
      ),
    communityName: (communityUuid) => {
      const known = communityNames.get(communityUuid)
      if (known) {
        return known
      }
      const asked = getCommunityName(communityUuid)
      communityNames.set(communityUuid, asked)
      return asked
    },
  }
}

/**
 * The member of ANOTHER community behind a booking, as a `User` model.
 *
 * First the `users` row the federation may have stored for them (`foreign = 1`); failing
 * that, the model is built from what the booking itself carries. Moved here from the
 * booking list, because the contact list needs the very same rule -- and the guard below
 * (NU-019: the stored name reaches `alias` only when it can be one) must not exist twice,
 * or one copy drifts.
 *
 * @param origin names the booking in the debug log, nothing else
 */
export const remoteUserFromBooking = async (
  ref: RemoteCounterpartyRef,
  logger: Logger,
  origin: string,
  lookups: CounterpartyLookups = dbLookups,
): Promise<User> => {
  if (!ref.linkedUserGradidoID) {
    // A programmer error, not a data condition: both callers filter on the id before they
    // get here. A lookup without it would have nothing to look up -- and a where clause
    // that quietly lost the id would find somebody else.
    throw new LogError('remoteUserFromBooking: booking without a counterparty gradido id', origin)
  }
  logger.debug('search for remoteUser...', ref.linkedUserCommunityUuid, ref.linkedUserGradidoID)
  const dbRemoteUser = await lookups.findForeignUser(
    ref.linkedUserCommunityUuid,
    ref.linkedUserGradidoID,
  )
  logger.debug(`found dbRemoteUser: ${dbRemoteUser?.id}`)
  const remoteUser = new User(dbRemoteUser)
  if (dbRemoteUser === null) {
    logger.debug(`no dbRemoteUser found, init from ${origin}`)
    if (ref.linkedUserCommunityUuid !== null) {
      remoteUser.communityUuid = ref.linkedUserCommunityUuid
    }
    remoteUser.gradidoID = ref.linkedUserGradidoID
    if (ref.linkedUserName) {
      // The stored name goes into the alias, and that is what the booking row
      // shows -- but ONLY when it can be an alias. Since #3645 this column holds
      // the alias for every booking made in the alias era; before that it held an
      // assembled "First Last", which the split below still relies on. Passing
      // such a value through the unguarded alias field would hand a member the
      // counterparty's real name, which is the one thing NU-019 forbids.
      //
      // The shape decides, because nothing else can -- see isAliasEraName, which
      // holds that rule and its limits. Where it says no, the row falls back to the
      // gradidoID. The split itself is untouched (KLAR-11, with Dario) and still
      // feeds firstName/lastName, which the guard shows to the moderation and to
      // nobody else.
      if (isAliasEraName(ref.linkedUserName)) {
        remoteUser.alias = ref.linkedUserName
      }
      remoteUser.firstName = ref.linkedUserName.slice(0, ref.linkedUserName.indexOf(' '))
      remoteUser.lastName = ref.linkedUserName?.slice(
        ref.linkedUserName.indexOf(' '),
        ref.linkedUserName.length,
      )
    }
  }
  // Only with a uuid to ask about: an undefined one would be dropped from the where clause
  // and answer with an arbitrary community's name.
  remoteUser.communityName = remoteUser.communityUuid
    ? await lookups.communityName(remoteUser.communityUuid)
    : null
  return remoteUser
}

/**
 * The member a booking list is narrowed to, from the reference the contact window sends:
 * the pair, and the `users` row carrying it where there is one.
 *
 * A pair nobody is stored under is not an error -- it is a counterparty with no row and,
 * almost certainly, no bookings: the list comes back empty under its own heading, and that
 * is the true answer. What it can NOT do is widen the list: `bookingsWhere` keeps the
 * caller's own id in every branch, whatever arrives here.
 */
export const bookingCounterparty = async (ref: {
  gradidoID: string
  communityUuid?: string | null
}): Promise<BookingCounterparty> => {
  const communityUuid = await resolveCommunityUuid(ref.communityUuid)
  return {
    localUserId: await dbFindUserIdByUuids(communityUuid, ref.gradidoID),
    gradidoId: ref.gradidoID,
    communityUuid,
  }
}
