// AI-GENERATED — not an architecture reference
import { PasswordEncryptionType } from '@enum/PasswordEncryptionType'
import { passwordDataSchema } from './passwordData.schema'

const GRADIDO_ID = '5c1b2d3e-4f50-4a61-8b72-9c83d4e5f607'

describe('passwordDataSchema', () => {
  it('hands back the data it was given', () => {
    expect(
      passwordDataSchema.parse({
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

  // The TypeORM entity spells it `gradidoID`, the Drizzle row `gradidoId`.
  it('reads the gradido id in either spelling', () => {
    expect(passwordDataSchema.parse({ gradidoID: GRADIDO_ID }).gradidoId).toBe(GRADIDO_ID)
    expect(passwordDataSchema.parse({ gradidoId: GRADIDO_ID }).gradidoId).toBe(GRADIDO_ID)
  })
})
