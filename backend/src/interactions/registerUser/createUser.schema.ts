import {
  aliasSchema,
  defaultLanguageSchema,
  emailSchema,
  firstNameSchema,
  lastNameSchema,
} from 'shared'
import { z } from 'zod'
import { presenceCodeSchema } from '@/data/PresenceCode.logic'
import { isValidPassword } from '@/password/EncryptorUtils'

export const createUserSchema = z.object({
  alias: aliasSchema.nullish(),
  email: emailSchema,
  firstName: firstNameSchema,
  lastName: lastNameSchema,
  language: defaultLanguageSchema,
  publisherId: z.number().nullish().default(0),
  redeemCode: z.string().nullish(),
  project: z.string().nullish(),
  referrerAlias: aliasSchema.nullish(),
  presenceCode: presenceCodeSchema.nullish(),
  password: z
    .string()
    .refine((pwd: string) => isValidPassword(pwd), {
      message:
        'Please enter a valid password with at least 8 characters, upper and lower case letters, at least one number and one special character!',
    })
    .nullish(), // TODO: move isValidPassword altogether to shared as schema
})

export type CreateUserInput = z.input<typeof createUserSchema>
export type CreateUser = z.infer<typeof createUserSchema>
