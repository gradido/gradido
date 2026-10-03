import {
  aliasSchema,
  blankAsNull,
  defaultLanguageSchema,
  emailSchema,
  firstNameSchema,
  lastNameSchema,
  passwordSchema,
} from 'shared'
import { z } from 'zod'
import { guarantorCodeSchema } from '@/data/GuarantorCode.logic'

// TODO: replace with valibot schema after update to typescript 5 is possible

// Everything a registration may bring. Which of the optional fields it brings decides the
// variant (registerUser.context); each variant parses again with its own schema below, in
// which the fields it lives on are required. The optional fields take a blank string as not
// given: the wallet reached by its path sends the absent redeem code as '', which otherwise
// decided the variant - it took the registration away from the guarantor code.
export const createUserSchema = z.object({
  alias: blankAsNull(aliasSchema),
  email: emailSchema,
  firstName: firstNameSchema,
  lastName: lastNameSchema,
  language: defaultLanguageSchema,
  publisherId: z.number().nullish(),
  redeemCode: blankAsNull(z.string()),
  project: blankAsNull(z.string()),
  referrerAlias: blankAsNull(aliasSchema),
  guarantorCode: blankAsNull(guarantorCodeSchema),
  password: passwordSchema.nullish(),
})

export type CreateUserInput = z.input<typeof createUserSchema>
export type CreateUser = z.infer<typeof createUserSchema>

export const projectRegistrationSchema = createUserSchema.extend({ project: z.string() })
export type ProjectRegistration = z.infer<typeof projectRegistrationSchema>

export const redeemRegistrationSchema = createUserSchema.extend({ redeemCode: z.string() })
export type RedeemRegistration = z.infer<typeof redeemRegistrationSchema>

export const referrerRegistrationSchema = createUserSchema.extend({ referrerAlias: aliasSchema })
export type ReferrerRegistration = z.infer<typeof referrerRegistrationSchema>

// The guarantor code opens an account with a password, so it comes with one.
export const guarantorRegistrationSchema = createUserSchema.extend({
  guarantorCode: guarantorCodeSchema,
  password: z
    .string({
      required_error: 'Guarantor code requires a password',
      invalid_type_error: 'Guarantor code requires a password',
    })
    .pipe(passwordSchema),
})
export type GuarantorRegistration = z.infer<typeof guarantorRegistrationSchema>
