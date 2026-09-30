import { uuidv4Schema } from 'shared'
import { z } from 'zod'
import { PasswordEncryptionType } from '@/graphql/enum/PasswordEncryptionType'

// TODO: replace with valibot schema after update to typescript 5 is possible

export const passwordDataSchema = z
  .object({
    id: z.number().positive().nullish(),
    passwordEncryptionType: z.number().nullish().default(PasswordEncryptionType.NO_PASSWORD),
    // The address as it is stored, not as a new one would be accepted: it is the salt of
    // PasswordEncryptionType.EMAIL and has to reach the derivation byte for byte. emailSchema
    // lowercases (a different salt, a password that no longer matches) and refuses a stored
    // address with a trailing blank - which MariaDB's PAD SPACE collation lets the login find,
    // so that account could sign in until this parse refused it.
    emailContact: z.object({ email: z.string() }).nullish(),
    gradidoId: uuidv4Schema.nullish(),
    gradidoID: uuidv4Schema.nullish(),
  })
  .transform((obj) => {
    if (obj.gradidoID) {
      obj.gradidoId = obj.gradidoID
    }
    return obj
  })
export type PasswordDataInput = z.input<typeof passwordDataSchema>
