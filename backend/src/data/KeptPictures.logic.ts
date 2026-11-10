// AI-GENERATED — not an architecture reference
import type { UserKeptPictureSubject } from 'database'

/**
 * How much of a member's own pictures one HTTP request may be served -- a full one counts one, a
 * removal one, the pairs one, the list of all small ones as the whole of it: a document may repeat
 * a field under any number of aliases (RequestBudget), and the list is up to a hundred pictures.
 * The wallet asks for the list in a request of its own, and for one full picture at a time.
 *
 * ⚠️ This counts the fields of the query. Aliases of `picture` INSIDE the list repeat it without
 * calling a resolver -- that needs a limit on the whole document (createServer.ts, the open query
 * complexity), as for memberAvatars.
 */
export const KEPT_PICTURES_MAX_PER_REQUEST = 10
export const KEPT_PICTURE_LIST_COUNTS = KEPT_PICTURES_MAX_PER_REQUEST

/**
 * The person a picture is of, as the table keeps it: lower case, so that one person is one row
 * however a client spells the uuids. `communityUuid` is already resolved (resolveCommunityUuid:
 * a missing one is this community's).
 */
export const keptPictureSubjectOf = (
  gradidoID: string,
  communityUuid: string,
): UserKeptPictureSubject => ({
  communityUuid: communityUuid.toLowerCase(),
  gradidoId: gradidoID.toLowerCase(),
})
