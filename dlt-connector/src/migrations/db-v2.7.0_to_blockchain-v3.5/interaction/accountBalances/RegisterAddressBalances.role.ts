import { AccountBalance, AccountBalances, GradidoUnit } from 'gradido-blockchain-js'
import { KeyPairIdentifierLogic } from '../../../../data/KeyPairIdentifier.logic'
import { ResolveKeyPair } from '../../../../interactions/resolveKeyPair/ResolveKeyPair.context'
import { Context } from '../../Context'
import { AbstractBalancesRole } from './AbstractBalances.role'


export class RegisterAddressBalancesRole extends AbstractBalancesRole  {
  async getAccountBalances(_context: Context): Promise<AccountBalances> {
    const accountBalances = new AccountBalances()
    const recipientKeyPair = await ResolveKeyPair(
      new KeyPairIdentifierLogic(this.transaction.user),
    )
    accountBalances.add(new AccountBalance(recipientKeyPair.getPublicKey(), GradidoUnit.zero(), ''))
    return accountBalances
  }
}