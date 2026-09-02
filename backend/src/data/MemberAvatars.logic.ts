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
 * ⛔ Counted per REQUEST, not per field, and that is the whole point: `memberAvatarFull`
 * takes one member, so a limit inside the resolver would count to one however many times
 * the field appears. GraphQL aliasing makes that number unbounded — `a: memberAvatarFull(…)
 * b: memberAvatarFull(…) …` is one document — and at roughly 60 KB a picture, five hundred
 * of them is a thirty-megabyte answer to a single authenticated request.
 *
 * Ten rather than one, because a member who opens several faces in a row on a flaky
 * connection may legitimately have a few in flight; and because a limit that the ordinary
 * use can reach gets raised by whoever hits it, without the reasoning being read again.
 */
export const MEMBER_AVATARS_FULL_MAX_PER_REQUEST = 10
