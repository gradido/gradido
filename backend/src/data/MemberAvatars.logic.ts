// AI-GENERATED — not an architecture reference

/**
 * What one `memberAvatars` request may name.
 *
 * ⛔ Dependency-free on purpose. The wallet chunks its requests by the same number
 * (frontend/src/composables/useMemberAvatars.js) because a request over the cap is refused
 * WHOLE -- so a wallet that keeps sending the old number after the cap is lowered shows no
 * pictures at all, silently. `useMemberAvatars.drift.spec.js` imports this file directly to
 * hold the two together, the way avatarColorIndex.drift.spec.js does, and it can only do
 * that as long as nothing here imports type-graphql or class-validator.
 */
export const MEMBER_AVATARS_MAX_REFS = 100

/**
 * How many FULL-size pictures one request may be served (AS-018).
 *
 * ⛔ Counted per HTTP REQUEST, not per field, and that is the whole point: `memberAvatarFull`
 * takes one member, so a limit inside the resolver would count to one however many times
 * the field appears. GraphQL aliasing makes that number unbounded — `a: memberAvatarFull(…)
 * b: memberAvatarFull(…) …` is one document — and at roughly 60 KB a picture, five hundred
 * of them is a thirty-megabyte answer to a single authenticated request. A POST may also
 * batch documents, each with its own copy of the context, so the count lives in the one
 * object they share (RequestBudget in backend/src/server/context.ts).
 *
 * Ten rather than one, because a member who opens several faces in a row on a flaky
 * connection may legitimately have a few in flight; and because a limit that the ordinary
 * use can reach gets raised by whoever hits it, without the reasoning being read again.
 */
export const MEMBER_AVATARS_FULL_MAX_PER_REQUEST = 10

/**
 * How long a member's own request waits for another community to answer about the pictures
 * of its members (the relay in UserResolver.memberAvatars and memberAvatarFull).
 *
 * The member is waiting, so this is short. Handed to the request as its signal
 * (core MemberAvatarsClient); a community that answers later simply shows no faces this time.
 *
 * ⛔ A constant, not an environment name: a new NAME=$NAME line in a .env.template breaks the
 * deploy hard (deployment/bare_metal/start.sh). Making it adjustable per server takes the
 * two-deploy route described there.
 */
export const XCOM_MEMBER_AVATARS_TIMEOUT_MS = 5000

/**
 * How many times one HTTP request may make memberAvatars ask another community.
 *
 * ⛔ Counted per HTTP REQUEST (RequestBudget in backend/src/server/context.ts), for the same
 * reason as MEMBER_AVATARS_FULL_MAX_PER_REQUEST: aliases repeat the field inside one document.
 * Asking another community is an outgoing request with an encrypted envelope, and the 100 KB
 * a request body may weigh (express.json's default) holds 702 aliases naming one member each,
 * or 2583 sharing one variable (measured). Without the cap one member's request would send
 * that many requests to the same community, whose rate limit would then refuse this server
 * for everybody.
 *
 * The wallet asks about one community per request (useMemberAvatars.js), so it needs one.
 * Ten leaves room for an older wallet that still mixes a few communities in one list.
 */
export const MEMBER_AVATARS_RELAYS_MAX_PER_REQUEST = 10

/**
 * How long the refresh of picture dates (AS-019, refreshForeignMemberAvatarDates) waits for
 * one block of answers from another community. Nobody waits on that run, so it may wait longer
 * than a member's request. A constant for the same reason as the one above.
 */
export const XCOM_MEMBER_AVATAR_DATES_TIMEOUT_MS = 10000

/**
 * How often the picture dates of other communities' members are asked again (AS-019,
 * refreshForeignMemberAvatarDates). This is how long a changed or withdrawn picture over there
 * takes, at most, to reach the lists here -- and, after a deploy, how long until the first run.
 *
 * ⛔ A constant, not an environment name, for the reason XCOM_MEMBER_AVATARS_TIMEOUT_MS gives.
 */
export const FOREIGN_AVATAR_DATES_REFRESH_MS = 10 * 60 * 1000

/**
 * Which of the refs this community answers itself, and which belong to another community.
 *
 * A ref without a community uuid is read as this community, the one reading the API gives a
 * null (resolveCommunityUuid). Everything else is grouped by its community, and every group --
 * this community's as well -- names each member once, however many rows of a list named them.
 *
 * ★ Grouped by the PAIR's community, never by the id alone: `users` is unique on
 * (gradido_id, community_uuid), so the same id under two communities is two people and is
 * asked about twice, once in each group.
 *
 * ⛔ The types are spelled out here instead of imported: this file is read directly by two
 * drift tests (the wallet's and the federation module's) and has to stay free of imports.
 */
export const splitMemberRefsByCommunity = (
  refs: readonly { gradidoID: string; communityUuid?: string | null }[],
  homeCommunityUuid: string,
): { home: string[]; foreign: Map<string, string[]> } => {
  const home = new Set<string>()
  const foreign = new Map<string, Set<string>>()
  for (const { gradidoID, communityUuid } of refs) {
    if (!communityUuid || communityUuid === homeCommunityUuid) {
      home.add(gradidoID)
      continue
    }
    const group = foreign.get(communityUuid) ?? new Set<string>()
    group.add(gradidoID)
    foreign.set(communityUuid, group)
  }
  return {
    home: [...home],
    foreign: new Map([...foreign].map(([communityUuid, ids]) => [communityUuid, [...ids]])),
  }
}
