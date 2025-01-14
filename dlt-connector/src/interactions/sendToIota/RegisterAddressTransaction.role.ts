/* eslint-disable camelcase */
import { GradidoTransactionBuilder } from 'gradido-blockchain-js'

import { KeyPairIdentifier } from '@/data/KeyPairIdentifier'
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
    const communityKeyPair = await KeyPairCalculation(
      new KeyPairIdentifier(this.self.user.communityUuid),
    )
    const keyPairIdentifer = new KeyPairIdentifier(this.self.user)
    const accountKeyPair = await KeyPairCalculation(keyPairIdentifer)
    // unsetting accountNr change identifier from account key pair to user key pair
    keyPairIdentifer.accountNr = undefined
    const userKeyPair = await KeyPairCalculation(keyPairIdentifer)
    builder
      .setCreatedAt(new Date(this.self.createdAt))
      .setRegisterAddress(
        userKeyPair.getPublicKey(),
        accountTypeToAddressType(this.self.accountType),
        uuid4ToHash(this.self.user.communityUser.uuid),
        accountKeyPair.getPublicKey(),
      )
      .sign(communityKeyPair)
      .sign(accountKeyPair)
      .sign(userKeyPair)
    return builder
  }
}
