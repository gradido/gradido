// AI-GENERATED — not an architecture reference
import { PasswordEncryptionType } from '@enum/PasswordEncryptionType'
import { getUserCryptographicSalt } from './EncryptorUtils'

const GRADIDO_ID = '5c1b2d3e-4f50-4a61-8b72-9c83d4e5f607'

/**
 * Two addresses as they stand in user_contacts on a live server: one with a trailing blank
 * (MariaDB's PAD SPACE collation lets the trimmed login input find it), one with capitals.
 * Neither passes emailSchema unchanged - and neither may be changed on the way to the salt.
 */
const STORED = ['bernd@example.com ', 'Bernd@Example.com']

describe('getUserCryptographicSalt', () => {
  it('salts an EMAIL account with its stored address, byte for byte', () => {
    for (const email of STORED) {
      expect(
        getUserCryptographicSalt({
          passwordEncryptionType: PasswordEncryptionType.EMAIL,
          emailContact: { email },
        }),
      ).toBe(email)
    }
  })

  // The login loads the address along with the account, so it reaches here for every type.
  it('salts a GRADIDO_ID account with its id, whatever address it holds', () => {
    for (const email of STORED) {
      expect(
        getUserCryptographicSalt({
          passwordEncryptionType: PasswordEncryptionType.GRADIDO_ID,
          gradidoID: GRADIDO_ID,
          emailContact: { email },
        }),
      ).toBe(GRADIDO_ID)
    }
  })
})
