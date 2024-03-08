import { Account } from '@entity/Account'

import { LogError } from '@/server/LogError'

import { KeyPair } from './KeyPair'
import { UserLogic } from './User.logic'

export class AccountLogic {
  // eslint-disable-next-line no-useless-constructor
  public constructor(private self: Account) {}

  /**
   * calculate account key pair starting from community key pair => derive user key pair => derive account key pair
   * @param communityKeyPair
   */
  public calculateKeyPair(communityKeyPair: KeyPair): KeyPair {
    if (!this.self.user) {
      throw new LogError('missing user')
    }
    const userLogic = new UserLogic(this.self.user)
    const accountKeyPair = userLogic
      .calculateKeyPair(communityKeyPair)
      .derive([this.self.derivationIndex])

    if (
      this.self.derive2Pubkey &&
      this.self.derive2Pubkey.compare(accountKeyPair.publicKey) !== 0
    ) {
      throw new LogError(
        'The freshly derived public key does not correspond to the stored public key',
      )
    }
    return accountKeyPair
  }
}
