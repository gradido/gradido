// AI-GENERATED — not an architecture reference

// Constants the wallet and the admin interface have to agree with: they take them from here,
// through `shared/browser`.

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
// The wallet chunks its requests by this number (frontend/src/composables/useMemberAvatars.js).
export const MEMBER_AVATARS_MAX_REFS = 100

// How many people a member may keep a picture of (AS-024): the table must not grow without end,
// and every list of the wallet carries all of them in the small rendition -- a hundred of those are
// about 1.3 MB. Replacing a picture already kept is not counted against it. The wallet names the
// number where a member reaches it (useKeptPictures.js).
export const KEPT_PICTURES_MAX_PER_MEMBER = 100

// The emoji a member may react to a chat message with (migration 0158): the wallet's own choice
// of forty-eight, row by row as the wallet shows them (frontend/src/utils/emojiChoice.js,
// EMOJI_ROWS). The backend takes no other reaction (setChatMessageReaction): what one wallet
// offers, every wallet draws, and nothing else is filed under a message for everybody to see.
//
// A sign of two code points carries the selector that asks for its coloured drawing (the heart,
// the sun, the two fingers); the wallet sends it as it stands here, and it is compared whole.
//
// The wallet's rows are these. Whoever changes an emoji leaves the reactions filed with the old
// one as they are: they are still read and shown.
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
export const USER_REMARK_MAX_CHARS = 2000

// What the backend answers a send (sendCoins, sendEmail) to a member nobody has, here or in
// another community, with what was looked for behind a colon: `${RECIPIENT_NOT_FOUND}: ${identifier}`.
// The wallet tells "no such account" from every other failure of a send by this sentence
// (frontend/src/utils/recipientNotFound.js). ⛔ Across the border too: a 404 of the other community becomes this sentence
// in core (processXComCompleteTransaction), nothing of that community's own words reaches the wallet.
export const RECIPIENT_NOT_FOUND = 'The recipient user was not found'

// What `user` answers for a member nobody has (UserResolver): the wallet's check "Jetzt prüfen"
// reads it whole, same file as above.
export const USER_NOT_FOUND = 'User not found'
