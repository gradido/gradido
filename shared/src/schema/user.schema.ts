import * as v from 'valibot'

// Kept beside the regex that enforces them, so a change to one is a change to the
// other in the same glance. Anything generating an alias has to respect both bounds.
export const ALIAS_MIN_CHARS = 3
export const ALIAS_MAX_CHARS = 20
export const VALID_ALIAS_REGEX = /^(?=.{3,20}$)[a-zA-Z0-9]+(?:[_-][a-zA-Z0-9]+?)*$/
// \p{L} = a character from every alphabet (latin, greek, cyrillic, etc.)
// first a character or ' is expected
// then all without the last a character, space, apostrophe or hyphen is expected
// last a character is expected
export const VALID_NAME_REGEX = /^[\p{L}'][ \p{L}'-_]*[\p{L}]$/u

export const RESERVED_ALIAS = [
  'admin',
  'email',
  'gast',
  'gdd',
  'gradido',
  'guest',
  'home',
  'root',
  'support',
  'temp',
  'tmp',
  'user',
  'usr',
  'var',
  'reserved',
  'undefined',
  'unknown',
]

// At least 8 characters, with a lower and an upper case letter, a digit and one other character,
// and no whitespace. The same rules as the wallet's password field (validation-rules.js).
export const passwordSchema = v.pipe(
  v.string(),
  v.regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9 \t\n\r])[^ \t\n\r]{8,}$/,
    'Please enter a valid password with at least 8 characters, upper and lower case letters, at least one number and one special character, and no spaces!',
  ),
)

export const aliasSchema = v.pipe(
  v.string(),
  v.minLength(3, 'Given alias is too short'),
  v.maxLength(20, 'Given alias is too long'),
  v.regex(VALID_ALIAS_REGEX, 'Invalid characters in alias'),
  v.check((val) => !RESERVED_ALIAS.includes(val.toLowerCase()), 'Given alias is not allowed'),
)

// TODO: use this schemas in backend, think about case which currently not fullfil the regex
// (some user start there name with : )
export const firstNameSchema = v.pipe(
  v.string(),
  v.minLength(3, 'First name is too short'),
  v.maxLength(255, 'First name is too long'),
)
// Off for now: VALID_NAME_REGEX would refuse about one in eight of today's names. Whether and
// how names are restricted is an open question of its own.
// v.regex(VALID_NAME_REGEX)

export const lastNameSchema = v.pipe(
  v.string(),
  v.minLength(2, 'Last name is too short'),
  v.maxLength(255, 'Last name is too long'),
)
// Off for now, see firstNameSchema.
// .regex(VALID_NAME_REGEX)
