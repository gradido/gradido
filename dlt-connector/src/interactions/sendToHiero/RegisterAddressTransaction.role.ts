import { AddressType, GradidoTransactionBuilder } from 'gradido-blockchain-js'
import * as v from 'valibot'
import { KeyPairIdentifierLogic } from '../../data/KeyPairIdentifier.logic'
import { Uuidv4Hash } from '../../data/Uuidv4Hash'
import {
  IdentifierCommunityAccount,
  identifierCommunityAccountSchema,
} from '../../schemas/account.schema'
import {
  RegisterAddressTransaction,
  registerAddressTransactionSchema,
  Transaction,
} from '../../schemas/transaction.schema'
import { HieroId } from '../../schemas/typeGuard.schema'
import { ResolveKeyPair } from '../resolveKeyPair/ResolveKeyPair.context'
import { AbstractTransactionRole } from './AbstractTransaction.role'

export class RegisterAddressTransactionRole extends AbstractTransactionRole {
  private readonly registerAddressTransaction: RegisterAddressTransaction
  private readonly account: IdentifierCommunityAccount
  constructor(input: Transaction) {
    super()
    this.registerAddressTransaction = v.parse(registerAddressTransactionSchema, input)
    this.account = v.parse(identifierCommunityAccountSchema, input.user.account)
  }

  getSenderCommunityTopicId(): HieroId {
    return this.registerAddressTransaction.user.communityTopicId
  }

  getRecipientCommunityTopicId(): HieroId {
    throw new Error('register address: cannot be used as cross group transaction yet')
  }

  public async getGradidoTransactionBuilder(): Promise<GradidoTransactionBuilder> {
    const builder = new GradidoTransactionBuilder()
    const communityTopicId = this.registerAddressTransaction.user.communityTopicId
    const communityKeyPair = await ResolveKeyPair(
      new KeyPairIdentifierLogic({
        communityTopicId,
        communityId: this.registerAddressTransaction.user.communityId,
      }),
    )
    const keyPairIdentifier = this.registerAddressTransaction.user
    // when accountNr is 0 it is the user account
    keyPairIdentifier.account.accountNr = 0
    const userKeyPair = await ResolveKeyPair(new KeyPairIdentifierLogic(keyPairIdentifier))
    keyPairIdentifier.account.accountNr = 1
    const accountKeyPair = await ResolveKeyPair(new KeyPairIdentifierLogic(keyPairIdentifier))

    builder
      .setCreatedAt(this.registerAddressTransaction.createdAt)
      .setSenderCommunity(this.registerAddressTransaction.user.communityId)
      .setRegisterAddress(
        userKeyPair.getPublicKey(),
        this.registerAddressTransaction.accountType as AddressType,
        new Uuidv4Hash(this.account.userUuid).getAsMemoryBlock(),
        accountKeyPair.getPublicKey(),
      )
      .sign(communityKeyPair)
      .sign(accountKeyPair)
      .sign(userKeyPair)
    return builder
  }
}
