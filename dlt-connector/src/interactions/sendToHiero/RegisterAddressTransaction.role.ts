import { AddressType, GradidoTransactionBuilder } from 'gradido-blockchain-js'
import { parse } from 'valibot'
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
import { KeyPairCalculation } from '../keyPairCalculation/KeyPairCalculation.context'
import { AbstractTransactionRole } from './AbstractTransaction.role'

export class RegisterAddressTransactionRole extends AbstractTransactionRole {
  private readonly registerAddressTransaction: RegisterAddressTransaction
  private readonly account: IdentifierCommunityAccount
  constructor(input: Transaction) {
    super()
    this.registerAddressTransaction = parse(registerAddressTransactionSchema, input)
    this.account = parse(identifierCommunityAccountSchema, input.user.account)
  }

  getSenderCommunityTopicId(): HieroId {
    return this.registerAddressTransaction.user.communityTopicId
  }

  getRecipientCommunityTopicId(): HieroId {
    throw new Error('register address: cannot be used as cross group transaction yet')
  }

  public async getGradidoTransactionBuilder(): Promise<GradidoTransactionBuilder> {
    const builder = new GradidoTransactionBuilder()
    const communityKeyPair = await KeyPairCalculation(
      new KeyPairIdentifierLogic({
        communityTopicId: this.registerAddressTransaction.user.communityTopicId,
      }),
    )
    const accountKeyPairIdentifier = this.registerAddressTransaction.user
    // when accountNr is 0 it is the user account
    const userKeyPairIdentifier = accountKeyPairIdentifier
    userKeyPairIdentifier.account.accountNr = 0

    const userKeyPair = await KeyPairCalculation(new KeyPairIdentifierLogic(userKeyPairIdentifier))
    const accountKeyPair = await KeyPairCalculation(
      new KeyPairIdentifierLogic(accountKeyPairIdentifier),
    )

    builder
      .setCreatedAt(this.registerAddressTransaction.createdAt)
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
