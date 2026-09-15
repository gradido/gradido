// AI-GENERATED — not an architecture reference

/**
 * How many members one `memberAvatars` field may name for kinds `small` and `dates`
 * (kind `full` names exactly one).
 *
 * ⛔ Checked in the resolver after decrypting, because the list travels inside the encrypted
 * payload and GraphQL sees only a string. It bounds ONE field. Aliases repeat the field and
 * a POST may batch operations, so what bounds a whole request is the body size express.json()
 * accepts in createServer.ts (100 KB) -- a request field for 100 ids is about 8 KB, one for a
 * single id about 1.5 KB.
 *
 * ⛔ Dependency-free on purpose, and the same number as MEMBER_AVATARS_MAX_REFS in
 * backend/src/data/MemberAvatars.logic.ts, the cap on what one wallet request may name. The
 * asking side is such a backend, so it has lists of that size to pass on; a question over
 * this cap is refused WHOLE, and a lower number here would cost every full list its faces
 * without an error anyone sees. MemberAvatars.logic.drift.test.ts imports the backend file
 * directly to hold the two together, and can only do that while neither imports anything.
 */
export const MEMBER_AVATARS_MAX_REFS = 100
