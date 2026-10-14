import {
  aliasSchema,
  blankAsNull,
  defaultLanguageSchema,
  emailSchema,
  firstNameSchema,
  lastNameSchema,
  MATCHING_ENTRY_DETAILS_MAX_CHARS,
  MATCHING_ENTRY_SUMMARY_MAX_CHARS,
  passwordSchema,
} from 'shared'
import * as v from 'valibot'
import { guarantorCodeSchema } from '@/data/GuarantorCode.logic'

// The entry an event link offered (Event-Matching): an interest, "I love ‹summary›", with a line
// or two that explain it and whether it is found from afar. The lengths are those of an
// entry's columns, because an entry is made of it once the address is confirmed -- so what is
// noted at the registration is always something an entry can hold. A sentence also has to say
// something: blank, it is refused.
//
// The wallet cuts the link's words to these lengths before it sends them. Anything longer comes
// from another client, and is refused rather than cut: this server says what it took.
export const eventMatchingEntrySchema = v.object({
  summary: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(1),
    v.maxLength(MATCHING_ENTRY_SUMMARY_MAX_CHARS),
  ),
  details: blankAsNull(v.pipe(v.string(), v.trim(), v.maxLength(MATCHING_ENTRY_DETAILS_MAX_CHARS))),
  remote: v.boolean(),
})
export type EventMatchingEntryUnparsed = v.InferInput<typeof eventMatchingEntrySchema>
export type EventMatchingEntry = v.InferOutput<typeof eventMatchingEntrySchema>

// Everything a registration may bring. Which of the optional fields it brings decides the
// variant (registerUser.context); each variant parses again with its own schema below, in
// which the fields it lives on are required. The optional fields take a blank string as not
// given: the wallet reached by its path sends the absent redeem code as '', which otherwise
// decided the variant - it took the registration away from the guarantor code.
export const createUserSchema = v.object({
  alias: blankAsNull(aliasSchema),
  email: emailSchema,
  firstName: firstNameSchema,
  lastName: lastNameSchema,
  language: defaultLanguageSchema,
  publisherId: v.nullish(v.number()),
  redeemCode: blankAsNull(v.string()),
  project: blankAsNull(v.string()),
  referrerAlias: blankAsNull(aliasSchema),
  guarantorCode: blankAsNull(guarantorCodeSchema),
  password: v.nullish(passwordSchema),
  // Decides no variant: whichever way the account is opened, the entry is noted with it.
  eventMatchingEntry: v.nullish(eventMatchingEntrySchema),
})

export type CreateUserInput = v.InferInput<typeof createUserSchema>
export type CreateUser = v.InferOutput<typeof createUserSchema>

export const projectRegistrationSchema = v.object({
  ...createUserSchema.entries,
  project: v.string(),
})
export type ProjectRegistration = v.InferOutput<typeof projectRegistrationSchema>

export const redeemRegistrationSchema = v.object({
  ...createUserSchema.entries,
  redeemCode: v.string(),
})
export type RedeemRegistration = v.InferOutput<typeof redeemRegistrationSchema>

export const referrerRegistrationSchema = v.object({
  ...createUserSchema.entries,
  referrerAlias: aliasSchema,
})
export type ReferrerRegistration = v.InferOutput<typeof referrerRegistrationSchema>

const PASSWORD_REQUIRED = 'Guarantor code requires a password'

// The guarantor code opens an account with a password, so it comes with one.
export const guarantorRegistrationSchema = v.object({
  ...createUserSchema.entries,
  guarantorCode: guarantorCodeSchema,
  // A key that is left out is answered by the object itself, in valibot's own words, before
  // the schema of the key is asked. With null as its default a missing password reaches the
  // string schema instead, which refuses it with the sentence a client is to read.
  password: v.optional(
    v.pipe(v.string(PASSWORD_REQUIRED), passwordSchema),
    null as unknown as string,
  ),
})
export type GuarantorRegistration = v.InferOutput<typeof guarantorRegistrationSchema>
