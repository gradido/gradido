/* eslint-disable camelcase */
import { GradidoTransactionBuilder } from 'gradido-blockchain-js'

import { TransactionErrorType } from '@/graphql/enum/TransactionErrorType'
import { TransactionDraft } from '@/graphql/input/TransactionDraft'
import { TransactionError } from '@/graphql/model/TransactionError'
import { LogError } from '@/server/LogError'
import { accountTypeToAddressType, uuid4ToHash } from '@/utils/typeConverter'

import { KeyPairCalculation } from '../keyPairCalculation/KeyPairCalculation.context'

import { AbstractTransactionRole } from './AbstractTransaction.role'

export class RegisterAddressTransactionRole extends AbstractTransactionRole {
  constructor(private self: TransactionDraft) {
    super()
  }

  getSenderCommunityUuid(): string {
    return this.self.user.communityUuid
  }

  getRecipientCommunityUuid(): string {
    throw new LogError('cannot yet be used as cross group transaction')
  }

  public async getGradidoTransactionBuilder(): Promise<GradidoTransactionBuilder> {
    if (!this.self.accountType) {
      throw new TransactionError(
        TransactionErrorType.MISSING_PARAMETER,
        'register address: account type missing',
      )
    }

    if (!this.self.user.communityUser) {
      throw new TransactionError(
        TransactionErrorType.MISSING_PARAMETER,
        "register address: user isn't a community user",
      )
    }

    const builder = new GradidoTransactionBuilder()
    const communityKeyPair = await KeyPairCalculation(this.self.user.communityUuid)
    const accountKeyPair = await KeyPairCalculation(this.self.user)
    builder
      .setCreatedAt(new Date(this.self.createdAt))
      .setRegisterAddress(
        accountKeyPair.getPublicKey(),
        accountTypeToAddressType(this.self.accountType),
        uuid4ToHash(this.self.user.communityUser.uuid),
      )
      .sign(communityKeyPair)
      .sign(accountKeyPair)
    return builder
  }
}
