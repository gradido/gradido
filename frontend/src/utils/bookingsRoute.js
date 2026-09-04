// AI-GENERATED — not an architecture reference

/**
 * The booking list narrowed to one member: the address the contact window links to, and
 * the way the transactions page reads it back.
 *
 * ⛔ ONE module for both ends. The parameter names were string literals in the window, on
 * the page and in both specs -- each spec mocked its own side, so renaming one end kept
 * every test green while the link silently opened the whole list. Here the builder and the
 * reader share the names, and bookingsRoute.spec.js sends one through the other.
 * `SEND_TYPES` (utils/sendTypes.js) does the same for `?art=`.
 */

/** The member's Gradido id. */
export const WITH_PARAM = 'with'
/** Their community's uuid, so a member of another community is found by the pair. */
export const COMMUNITY_PARAM = 'community'

/**
 * As long as the server's MemberAvatarRefInput accepts (`@MaxLength(36)`, a uuid). Anything
 * longer would fail argument validation and put an error banner under a mark that claims
 * a narrowing -- so it counts as no narrowing here, like an array does.
 */
const MEMBER_ID_MAX_LENGTH = 36

/**
 * ⛔ `route.query.x` is `string | string[] | null`: `?with=a&with=b` arrives as an array,
 * and an array sent as the id is a request the schema refuses, so the whole list would
 * fail. What is not one plain string of a member id's length is treated as nothing.
 */
const memberIdOrNull = (value) =>
  typeof value === 'string' && value !== '' && value.length <= MEMBER_ID_MAX_LENGTH ? value : null

/**
 * Where "51 bookings, last on 24.08." leads: the transactions page, narrowed to this member.
 *
 * The Gradido id, not the alias: an alias can be given up and taken by somebody else, and a
 * bookmarked filter would then point at the wrong person's bookings. The pair, because the
 * count in the window was computed by the same pair for a member of another community.
 *
 * @param {{gradidoID: string, communityUuid?: string|null}|null|undefined} member
 */
export const bookingsWithMemberRoute = (member) => ({
  path: '/transactions',
  query: {
    [WITH_PARAM]: member?.gradidoID,
    [COMMUNITY_PARAM]: member?.communityUuid,
  },
})

/**
 * The member an address is narrowed to, or null when it is not narrowed. The community may
 * be missing; the server fills in its own for a member sent without one, the way it does
 * for a heart.
 *
 * @param {object|undefined} query `route.query`
 * @returns {{gradidoID: string, communityUuid: string|null}|null}
 */
export const memberFromQuery = (query) => {
  const gradidoID = memberIdOrNull(query?.[WITH_PARAM])
  if (!gradidoID) return null
  return { gradidoID, communityUuid: memberIdOrNull(query?.[COMMUNITY_PARAM]) }
}

/**
 * The same member, the same string -- for a watch. `memberFromQuery` builds a fresh object
 * on every read of the address, and a watch on the object fires on identity: a navigation
 * that rebuilt the address with the same pair would reset the list without a fetch. The
 * key changes only when the pair does.
 */
export const memberQueryKey = (member) =>
  member ? `${member.gradidoID}/${member.communityUuid ?? ''}` : ''
