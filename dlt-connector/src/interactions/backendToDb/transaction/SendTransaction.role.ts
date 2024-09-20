/* eslint-disable camelcase */
import {
  CrossGroupType,
  CrossGroupType_LOCAL,
  CrossGroupType_OUTBOUND,
  MemoryBlock,
  GradidoTransactionBuilder,
  TransferAmount,
} from 'gradido-blockchain-js'

import { UserIdentifier } from '@/graphql/input/UserIdentifier'

import { AbstractTransactionRole } from './AbstractTransaction.role'

export class SendTransactionRole extends AbstractTransactionRole {
  public getSigningUser(): UserIdentifier {
    return this.self.user
  }

  public getRecipientUser(): UserIdentifier {
    return this.self.linkedUser
  }

  public async getGradidoTransactionBuilder(): Promise<GradidoTransactionBuilder> {
    const builder = new GradidoTransactionBuilder()
    const signingUser = await this.loadUser(this.self.user)
    const recipientUser = await this.loadUser(this.self.linkedUser)
    return builder
      .setTransactionTransfer(
        new TransferAmount(new MemoryBlock(signingUser.derive2Pubkey), this.self.amount.toString()),
        new MemoryBlock(recipientUser.derive2Pubkey),
      )
      .setMemo('dummy memo for transfer')
  }
}
