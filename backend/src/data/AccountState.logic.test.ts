// AI-GENERATED — not an architecture reference
import { AccountState } from 'database'
import { PasswordEncryptionType } from 'shared'
import { accountStateFromFields } from './AccountState.logic'

const local = {
  foreign: false,
  referrerId: null,
  passwordEncryptionType: PasswordEncryptionType.NO_PASSWORD,
}

describe('accountStateFromFields', () => {
  it('is FOREIGN for a copy of another community, whatever else it holds', () => {
    expect(accountStateFromFields({ ...local, foreign: true }, true)).toBe(AccountState.FOREIGN)
  })

  it('is ACTIVATED once the address is confirmed, guest of a table or not', () => {
    expect(accountStateFromFields(local, true)).toBe(AccountState.ACTIVATED)
    expect(
      accountStateFromFields(
        { ...local, referrerId: 7, passwordEncryptionType: PasswordEncryptionType.GRADIDO_ID },
        true,
      ),
    ).toBe(AccountState.ACTIVATED)
  })

  it('is PARTLY_ACTIVATED_GUARANTOR for an unconfirmed account with referrer and password', () => {
    expect(
      accountStateFromFields(
        { ...local, referrerId: 7, passwordEncryptionType: PasswordEncryptionType.GRADIDO_ID },
        false,
      ),
    ).toBe(AccountState.PARTLY_ACTIVATED_GUARANTOR)
  })

  it('is REGISTERED for an unconfirmed classic registration, referred or not', () => {
    expect(accountStateFromFields(local, false)).toBe(AccountState.REGISTERED)
    expect(accountStateFromFields({ ...local, referrerId: 7 }, false)).toBe(AccountState.REGISTERED)
    expect(
      accountStateFromFields(
        { ...local, passwordEncryptionType: PasswordEncryptionType.GRADIDO_ID },
        false,
      ),
    ).toBe(AccountState.REGISTERED)
  })
})
