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

// The emoji a member may react to a chat message with (migration 0158): the wallet's own choice
// of forty-eight, row by row as the wallet shows them (frontend/src/utils/emojiChoice.js,
// EMOJI_ROWS). The backend takes no other reaction (setChatMessageReaction): what one wallet
// offers, every wallet draws, and nothing else is filed under a message for everybody to see.
//
// A sign of two code points carries the selector that asks for its coloured drawing (the heart,
// the sun, the two fingers); the wallet sends it as it stands here, and it is compared whole.
//
// The wallet has no dependency on `shared`; emojiChoice.drift.spec.js holds its rows against
// these. Whoever changes an emoji changes it in both -- and leaves the reactions filed with the
// old one as they are: they are still read and shown.
export const CHAT_REACTION_EMOJI_ROWS: readonly (readonly string[])[] = [
  ['🙂', '😊', '😄', '😂', '🤣', '😉', '😍', '🥰'],
  ['😘', '🤗', '😎', '🤔', '😮', '😅', '😢', '😴'],
  ['👍', '👏', '🙏', '🙌', '👋', '🤝', '💪', '✌️'],
  ['❤️', '🧡', '💛', '💚', '💙', '💜', '💖', '✨'],
  ['🌱', '🌻', '🌈', '☀️', '🍀', '🎉', '🎁', '🎂'],
  ['☕', '🍰', '🏡', '🚲', '📅', '✅', '❓', '❗'],
]

// How long the moderation's remark on a member may be (migration 0168, setUserRemark): a few lines
// of hints -- "Bürgermeisterin von Lieblingsstadt", "Tochter von Ramona" --, not a file.
//
// Counted twice, and not alike: the server as class-validator's MaxLength counts (validator.js:
// an emoji is one character, a variation selector none), the admin's field as `maxlength` counts
// (UTF-16 code units: an emoji is two). The field is the stricter, so whatever it lets through,
// the server takes. The `text` column holds the heaviest: 2000 emoji are some 8,000 bytes.
//
// The admin interface has no dependency on `shared`; userRemark.drift.spec.ts there holds its
// copy against this one.
export const USER_REMARK_MAX_CHARS = 2000
