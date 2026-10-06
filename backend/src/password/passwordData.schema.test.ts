// AI-GENERATED — not an architecture reference

import { PasswordEncryptionType } from '@enum/PasswordEncryptionType'
import * as v from 'valibot'
import { passwordDataSchema } from './passwordData.schema'

const GRADIDO_ID = '5c1b2d3e-4f50-4a61-8b72-9c83d4e5f607'

describe('passwordDataSchema', () => {
  it('hands back the data it was given', () => {
    expect(
      v.parse(passwordDataSchema, {
        id: 3,
        passwordEncryptionType: PasswordEncryptionType.EMAIL,
        emailContact: { email: 'bernd@example.com' },
      }),
    ).toEqual(
      expect.objectContaining({
        id: 3,
        passwordEncryptionType: PasswordEncryptionType.EMAIL,
        emailContact: { email: 'bernd@example.com' },
      }),
    )
  })

  // Stored data, not input: the address stays exactly as it is in user_contacts, whether or not
  // emailSchema would accept it today.
  it('keeps a stored address byte for byte, blank and capitals included', () => {
    for (const email of ['bernd@example.com ', 'Bernd@Example.com']) {
      expect(v.parse(passwordDataSchema, { emailContact: { email } }).emailContact?.email).toBe(
        email,
      )
    }
  })

  // The TypeORM entity spells it `gradidoID`, the Drizzle row `gradidoId`.
  it('reads the gradido id in either spelling', () => {
    expect(v.parse(passwordDataSchema, { gradidoID: GRADIDO_ID }).gradidoId).toBe(GRADIDO_ID)
    expect(v.parse(passwordDataSchema, { gradidoId: GRADIDO_ID }).gradidoId).toBe(GRADIDO_ID)
  })
})
