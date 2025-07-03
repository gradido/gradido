/* eslint-disable camelcase */
import { GradidoTransactionBuilder } from 'gradido-blockchain-js'

import { KeyPairIdentifierLogic } from '../../data/KeyPairIdentifier.logic'

import { KeyPairCalculation } from '../keyPairCalculation/KeyPairCalculation.context'

import { AbstractTransactionRole } from './AbstractTransaction.role'
import { RegisterAddressTransactionInput, registerAddressTransactionSchema, RegisterAddressTransaction } from '../../schemas/transaction.schema'
import { IdentifierAccount, IdentifierCommunityAccount, identifierCommunityAccountSchema } from '../../schemas/account.schema'
import * as v from 'valibot'
import { TRPCError } from '@trpc/server'
import { uuid4ToHashSchema } from '../../schemas/typeConverter.schema'

export class RegisterAddressTransactionRole extends AbstractTransactionRole {
  private tx: RegisterAddressTransaction
  private account: IdentifierCommunityAccount
  constructor(input: RegisterAddressTransactionInput) {
    super()
    this.tx = v.parse(registerAddressTransactionSchema, input)
    this.account = v.parse(identifierCommunityAccountSchema, input.user.account)
  }

  getSenderCommunityUuid(): string {
    return this.tx.user.communityUuid
  }

  getRecipientCommunityUuid(): string {
    throw new TRPCError({
      code: 'NOT_IMPLEMENTED',
      message: 'register address: cannot be used as cross group transaction yet',
    })
  }

  public async getGradidoTransactionBuilder(): Promise<GradidoTransactionBuilder> {
    const builder = new GradidoTransactionBuilder()
    const communityKeyPair = await KeyPairCalculation(
      new KeyPairIdentifierLogic({ communityUuid: this.tx.user.communityUuid }),
    )
    const userKeyPairIdentifier: IdentifierAccount = {
      communityUuid: this.tx.user.communityUuid,
      account: {
        userUuid: this.account.userUuid,
        accountNr: 0,
      },
    }
    const accountKeyPairIdentifier: IdentifierAccount = {
      communityUuid: this.tx.user.communityUuid,
      account: {
        userUuid: this.account.userUuid,
        accountNr: this.account.accountNr,
      },
    }
    const userKeyPair = await KeyPairCalculation(
      new KeyPairIdentifierLogic(userKeyPairIdentifier)
    )
    const accountKeyPair = await KeyPairCalculation(
      new KeyPairIdentifierLogic(accountKeyPairIdentifier)
    )

    builder
      .setCreatedAt(this.tx.createdAt)
      .setRegisterAddress(
        userKeyPair.getPublicKey(),
        this.tx.accountType,
        v.parse(uuid4ToHashSchema, this.account.userUuid),
        accountKeyPair.getPublicKey(),
      )
      .sign(communityKeyPair)
      .sign(accountKeyPair)
      .sign(userKeyPair)
    return builder
  }
}
