import { emailSchema, uuidv4Schema } from 'shared'
import { z } from 'zod'
import { PasswordEncryptionType } from '@/graphql/enum/PasswordEncryptionType'

// TODO: replace with valibot schema after update to typescript 5 is possible

export const passwordDataSchema = z
  .object({
    id: z.number().positive().nullish(),
    passwordEncryptionType: z.number().nullish().default(PasswordEncryptionType.NO_PASSWORD),
    emailContact: z.object({ email: emailSchema }).nullish(),
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
