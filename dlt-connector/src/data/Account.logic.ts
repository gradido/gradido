import { Account } from '@entity/Account'
import { Decimal } from 'decimal.js-light'

import { DecayLoggingView } from '@/logging/DecayLogging.view'
import { logger } from '@/logging/logger'
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

  public calculateBalanceCreatedAt(newCreateAtDate: Date): Decimal {
    logger.debug('calculate decay with', {
      amount: this.account.balanceOnCreation.toString(),
      from: this.account.balanceCreatedAt.toISOString(),
      to: newCreateAtDate.toISOString(),
    })
    const decay = calculateDecay(
      this.account.balanceOnCreation,
      this.account.balanceCreatedAt,
      newCreateAtDate,
    )
    return decay.balance
  }

  /**
   * calculate key pair for this specific account
   * @param
   * @returns
   */
  public getKeyPair(communityKeyPair: KeyPair): KeyPair | null {
    switch (this.account.type) {
      case AddressType.NONE:
        return null
      case AddressType.COMMUNITY_HUMAN:
      case AddressType.COMMUNITY_PROJECT:
      case AddressType.SUBACCOUNT:
        if (!this.account.user || !this.account.derivationIndex) {
          throw new LogError('no user or derivation index for account')
        }
        return new UserLogic(this.account.user)
          .calculateKeyPair(communityKeyPair)
          .derive([this.account.derivationIndex])
      case AddressType.COMMUNITY_GMW:
        return communityKeyPair.derive([hardenDerivationIndex(GMW_ACCOUNT_DERIVATION_INDEX)])
      case AddressType.COMMUNITY_AUF:
        return communityKeyPair.derive([hardenDerivationIndex(AUF_ACCOUNT_DERIVATION_INDEX)])
      default:
        return null
    }
  }
}
