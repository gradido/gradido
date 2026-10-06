import { uuidv4Schema } from 'shared'
import * as v from 'valibot'
import { PasswordEncryptionType } from '@/graphql/enum/PasswordEncryptionType'

export const passwordDataSchema = v.pipe(
  v.object({
    id: v.nullish(v.pipe(v.number(), v.gtValue(0))),
    passwordEncryptionType: v.optional(v.nullable(v.number()), PasswordEncryptionType.NO_PASSWORD),
    // The address as it is stored, not as a new one would be accepted: it is the salt of
    // PasswordEncryptionType.EMAIL and has to reach the derivation byte for byte. emailSchema
    // lowercases (a different salt, a password that no longer matches) and refuses a stored
    // address with a trailing blank - which MariaDB's PAD SPACE collation lets the login find,
    // so that account could sign in until this parse refused it.
    emailContact: v.nullish(v.object({ email: v.string() })),
    gradidoId: v.nullish(uuidv4Schema),
    gradidoID: v.nullish(uuidv4Schema),
  }),
  v.transform((obj) => {
    if (obj.gradidoID) {
      obj.gradidoId = obj.gradidoID
    }
    return obj
  }),
)
export type PasswordDataInput = v.InferInput<typeof passwordDataSchema>
export type PasswordData = v.InferOutput<typeof passwordDataSchema>
