// AI-GENERATED — not an architecture reference
import { AccountState } from 'database'
import { PasswordEncryptionType } from 'shared'

/**
 * The state a not deleted account stands in, derived from the fields that decided it before
 * `account_state` existed - the same rule migration 0148 filled the column with. For an
 * account coming back from DELETED, whose earlier state the column no longer holds.
 *
 * TODO: gone once every transition is written where it happens - see the issue "Complete
 * refactor for account state".
 */
export const accountStateFromFields = (
  user: { foreign: boolean; referrerId?: number | null; passwordEncryptionType: number },
  emailChecked: boolean,
): AccountState => {
  if (user.foreign) {
    return AccountState.FOREIGN
  }
  if (emailChecked) {
    return AccountState.ACTIVATED
  }
  if (
    (user.referrerId ?? null) !== null &&
    user.passwordEncryptionType !== PasswordEncryptionType.NO_PASSWORD
  ) {
    return AccountState.PARTLY_ACTIVATED_GUARANTOR
  }
  return AccountState.REGISTERED
}
