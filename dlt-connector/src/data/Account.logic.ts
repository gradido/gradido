import { Account } from '@entity/Account'
import { Decimal } from 'decimal.js-light'

import { KeyManager } from '@/manager/KeyManager'
import { LogError } from '@/server/LogError'
import { calculateDecay } from '@/utils/decay'
import { hardenDerivationIndex } from '@/utils/derivationHelper'

import { AUF_ACCOUNT_DERIVATION_INDEX, GMW_ACCOUNT_DERIVATION_INDEX } from './const'
import { KeyPair } from './KeyPair'
import { AddressType } from './proto/3_3/enum/AddressType'
import { UserLogic } from './User.logic'

export class AccountLogic {
  // eslint-disable-next-line no-useless-constructor
  constructor(private account: Account) {}

  public calculateBalanceCreatedAt(newCreateAtDate: Date, amount: Decimal): Decimal {
    const decay = calculateDecay(
      this.account.balanceCreatedAt,
      this.account.balanceCreatedAtDate,
      newCreateAtDate,
    )
    return decay.balance.add(amount)
  }

  /**
   * calculate key pair for this specific account
   * @param parentKeys if null, use home community key pair as parent key pair
   * @returns
   */
  public getKeyPair(parentKeys?: KeyPair): KeyPair | null {
    const km = KeyManager.getInstance()
    switch (this.account.type) {
      case AddressType.NONE:
        return null
      case AddressType.COMMUNITY_HUMAN:
      case AddressType.COMMUNITY_PROJECT:
      case AddressType.SUBACCOUNT:
        if (!this.account.user || !this.account.derivationIndex) {
          throw new LogError('no user or derivation index for account')
        }
        return km.derive(
          [this.account.derivationIndex],
          new UserLogic(this.account.user).calculateKeyPair(parentKeys),
        )
      case AddressType.COMMUNITY_GMW:
        return km.derive([hardenDerivationIndex(GMW_ACCOUNT_DERIVATION_INDEX)], parentKeys)
      case AddressType.COMMUNITY_AUF:
        return km.derive([hardenDerivationIndex(AUF_ACCOUNT_DERIVATION_INDEX)], parentKeys)
      default:
        return null
    }
  }
}
