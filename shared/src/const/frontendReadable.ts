// AI-GENERATED — not an architecture reference

// Constants the wallet has to agree with. The frontend has no dependency on `shared`, so it
// keeps its own copy of each and a drift spec there imports THIS FILE directly to hold the
// two together.
//
// ⛔ No imports here, ever. `./index` loads `shared-native`, a native addon the frontend's
// tests do not build; a drift spec that reached it would fail on a clean checkout. That is
// the only reason these constants do not stand in `./index` with the others.

// How many members one `memberAvatars` question may name: what one wallet request may name
// in the backend, and what one `memberAvatars` field may name for kinds `small` and `dates`
// in the federation module (kind `full` names exactly one).
//
// One number for both sides of the border on purpose. A community passes its wallets' lists
// on, and a question over this cap is refused WHOLE -- so a lower number on the answering
// side would cost every full list its faces without an error anyone sees.
//
// In the federation module it is checked in the resolver after decrypting, because the list
// travels inside the encrypted payload and GraphQL sees only a string. It bounds ONE field.
// Aliases repeat the field, so what bounds a whole request is the body size express.json()
// accepts in createServer.ts (100 KB) -- a request field for 100 ids is about 8 KB, one for
// a single id about 1.5 KB.
//
// The wallet chunks its requests by the same number (frontend/src/composables/
// useMemberAvatars.js) and has no dependency on `shared`; useMemberAvatars.drift.spec.js
// holds its copy against this one.
export const MEMBER_AVATARS_MAX_REFS = 100
