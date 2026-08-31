import { getDecayRespiteCent, getDecayStartTime } from 'shared-native'

export const LOG4JS_BASE_CATEGORY_NAME = 'shared'

// gradido transaction logic constants
// for transaction links
export const CODE_VALID_DAYS_DURATION = 14

// decay
export const DECAY_START_TIME = getDecayStartTime()

/**
 * The tolerance buffer for balance validation and decay calculations, expressed in GradidoCent.
 *
 * This constant accounts for rounding errors, timestamp discrepancies (e.g., Hedera consensus delay),
 * and natural imprecision in continuous decay calculations. It ensures that micro‑transactions are not
 * incorrectly rejected due to mathematical drift, reflecting Gradido's principle of generosity.
 *
 * 100 GradidoCent = 0.01 GDD
 *
 * @constant {number} GRADIDO_DECAY_RESPITE_CENT
 */
export const DECAY_RESPITE_CENT = getDecayRespiteCent()

// for contributions
// 1'000 gdd = 10'000'000 gdd cent
export const MAX_CREATION_AMOUNT = 10000000n

// input validation
export const CONTRIBUTIONLINK_NAME_MAX_CHARS = 100
export const CONTRIBUTIONLINK_NAME_MIN_CHARS = 5
// memo travels with a transaction: it is stored in a varchar(512) column and is
// re-validated by the dlt-connector, so these bounds must not be widened here.
export const MEMO_MAX_CHARS = 512
export const MEMO_MIN_CHARS = 5
// a person-to-person message carries no amount and is stored in no varchar column,
// so it can be roomier than a memo. A short reply like "Yes" has to pass as well.
export const MESSAGE_MAX_CHARS = 2000
export const MESSAGE_MIN_CHARS = 1
// matching: what a member writes about themselves, and the long form of a single
// entry. Both are `text` columns, so the database bound is 65535 BYTES — under
// utf8mb4 an emoji costs four of them, and hitting that bound surfaces as a raw
// driver error. These caps keep the failure a validation message instead, and they
// also cap what is forwarded to the GMS.
export const ABOUT_ME_MAX_CHARS = 2000
export const MATCHING_ENTRY_DETAILS_MAX_CHARS = 2000

// matching, the keying of an entry: a language model turns the one sentence a member
// wrote into the words their entry can be found under, plus seven fields saying what
// it is about. Those words go on to the GMS and into a vocabulary every community
// shares, so these bounds are the second set that has to agree across the two
// repositories - same names, same values, in the GMS's own `shared` package.
//
// The split of duties behind them: here the model's answer is cleaned, so anything
// over a bound is dropped and logged against the entry it came from. The GMS refuses
// it outright, because it is the last place before a table every community reads.
//
// A key word is one German word - a compound and its parts, an activity, a person -
// so 64 characters is far past any real one (the longest anyone writes down is around
// 40). What this catches is not a long word but a model that answered with a sentence.
export const KEY_WORD_MAX_CHARS = 64
// Measured over 735 entries the model coins 5,8 key words per entry, so this is
// roughly eleven times what one really carries - enough to bound a runaway answer
// without ever touching a real one.
export const MAX_KEY_WORDS_PER_ENTRY = 64
// subject, activity, category, area, actor, sought actor - all asked for as one word.
export const KEY_FIELD_MAX_CHARS = 64
// Traits - condition, level, material, professional or private, who it is for - may be
// short phrases rather than single words, so only their number and length are bounded.
export const MAX_KEY_TRAITS_PER_ENTRY = 16
export const KEY_TRAIT_MAX_CHARS = 64
// Which version of the keying instruction produced an entry's fields. Stored against
// the entry so that improving the instruction reaches the entries written before it,
// instead of only the ones written after.
export const INSTRUCTION_VERSION_MAX_CHARS = 32
// How many words one call may report to the GMS vocabulary. A whole batch's worth is
// collected and then sent in chunks of this size, so it is a chunk size rather than a
// ceiling on what a batch may coin.
export const MAX_REPORTED_KEY_WORDS = 500
// How many vocabulary words one call may fetch from the GMS.
export const MATCHING_VOCABULARY_PAGE_MAX = 5000

// avatar: the profile picture a member sets for their own account. One upload produces
// two JPEGs, and both travel in the same mutation — so these two limits share one
// budget rather than each having their own.
//
// The budget is the request body limit: express's default 100 KB (createServer.ts calls
// json() with no argument). Base64 grows bytes by about 37%, so the two images together
// must stay under roughly 73 KB for the request to fit with its query text around it.
// 60 + 10 comes to 70 KB, arriving as about 96 KB of string.
//
// Keeping our own limits below what express accepts is the point: a member who is over
// budget has to get "Avatar image too large" from us, not a bare 413 from the framework
// that says nothing about which picture or by how much.
//
// Both are backstops for a client that did not do its own step-down, not values anyone
// should reach — the browser targets ~55 KB and ~8 KB respectively.
export const AVATAR_FULL_MAX_BYTES = 60 * 1024
export const AVATAR_SMALL_MAX_BYTES = 10 * 1024
// A JPEG begins with these two bytes and ends with these two. Checking both ends is still
// not format validation -- only a decoder could say whether the pixels in between are a
// picture -- but it is what can be had without one, and a decoder is exactly what this
// design keeps out of the backend: the browser encodes both renditions so that no image
// library, and no CPU per request, is needed here.
//
// Checking the end as well as the start matters more than it looks. `FFD8` alone accepts
// a three-byte payload, so the column would take arbitrary data from anyone who prefixes
// it correctly. A file that also ends in `FFD9` has at least been through something that
// produces JPEG structure.
export const JPEG_MAGIC_BYTES = [0xff, 0xd8]
export const JPEG_END_BYTES = [0xff, 0xd9]

// alias: how often a member may pick a name, and over what stretch. Four a year is
// not a tidiness rule -- it is the brake against somebody cycling through near-misses
// of a popular name to catch payments meant for its owner. The confirmation dialog
// guards against typos; this guards against hoarding, and the two must not be confused.
//
// What is counted is picks, not renames: a name the system handed out costs nothing
// until the member adopts it, and coming back to a name they already own is free,
// because no name enters their possession. So four is more generous than it reads.
export const ALIAS_QUOTA_PER_WINDOW = 4
export const ALIAS_QUOTA_WINDOW_MS = 365 * 24 * 60 * 60 * 1000

// authentication
// 10 minutes
export const FEDERATION_AUTHENTICATION_TIMEOUT_MS = 60 * 1000 * 10
export const REDEEM_JWT_TOKEN_EXPIRATION = '10m'
export const GRADIDO_REALM = 'gradido'

// communication with frontend
export const DEFAULT_PAGINATION_PAGE_SIZE = 25
export const FRONTEND_CONTRIBUTIONS_ITEM_ANCHOR_PREFIX = 'contributionListItem-'
export const FRONTEND_LOGIN_ROUTE = 'login'

// Mirrors the users.salutation column (varchar 255, migration 0105); the admin field
// carries the same limit, so an over-long value is stopped before it gets here.
export const SALUTATION_MAX_LENGTH = 255
