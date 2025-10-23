import { string } from 'zod'

export const VALID_ALIAS_REGEX = /^(?=.{3,20}$)[a-zA-Z0-9]+(?:[_-][a-zA-Z0-9]+?)*$/
// \p{L} = a character from every alphabet (latin, greek, cyrillic, etc.)
// first a character or ' is expected
// then all without the last a character, space, apostrophe or hyphen is expected
// last a character is expected
export const VALID_NAME_REGEX = /^[\p{L}'][ \p{L}'-_]*[\p{L}]$/u 

const RESERVED_ALIAS = [
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
  'undefined'
]

export const aliasSchema = string()
  .min(3, 'Given alias is too short')
  .max(20, 'Given alias is too long')
  .regex(VALID_ALIAS_REGEX, 'Invalid characters in alias')
  .refine((val) => !RESERVED_ALIAS.includes(val.toLowerCase()), {
    message: 'Given alias is not allowed',
  })

// TODO: use this schemas in backend, think about case which currently not fullfil the regex
// (some user start there name with : )
export const firstNameSchema = string()
  .min(3, 'First name is too short')
  .max(255, 'First name is too long')
  .regex(VALID_NAME_REGEX)

export const lastNameSchema = string()
  .min(2, 'Last name is too short')
  .max(255, 'Last name is too long')
  .regex(VALID_NAME_REGEX)