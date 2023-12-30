import { Transaction } from '@entity/Transaction'
import { Field, Message, OneOf } from 'protobufjs'

import { CommunityDraft } from '@/graphql/input/CommunityDraft'
import { TransactionDraft } from '@/graphql/input/TransactionDraft'
import { LogError } from '@/server/LogError'
import { timestampToDate } from '@/utils/typeConverter'

import { AbstractTransaction } from '../AbstractTransaction'
import { determineCrossGroupType, determineOtherGroup } from '../transactionBody.logic'

import { CommunityRoot } from './CommunityRoot'
import { PROTO_TRANSACTION_BODY_VERSION_NUMBER } from './const'
import { CrossGroupType } from './enum/CrossGroupType'
import { TransactionType } from './enum/TransactionType'
import { GradidoCreation } from './GradidoCreation'
import { GradidoDeferredTransfer } from './GradidoDeferredTransfer'
import { GradidoTransfer } from './GradidoTransfer'
import { GroupFriendsUpdate } from './GroupFriendsUpdate'
import { RegisterAddress } from './RegisterAddress'
import { Timestamp } from './Timestamp'

// https://www.npmjs.com/package/@apollo/protobufjs
// eslint-disable-next-line no-use-before-define
export class TransactionBody extends Message<TransactionBody> {
  public constructor(transaction?: TransactionDraft | CommunityDraft) {
    if (transaction) {
      let type = CrossGroupType.LOCAL
      let otherGroup = ''
      if (transaction instanceof TransactionDraft) {
        type = determineCrossGroupType(transaction)
        otherGroup = determineOtherGroup(type, transaction)
      }

      super({
        memo: 'Not implemented yet',
        createdAt: new Timestamp(new Date(transaction.createdAt)),
        versionNumber: PROTO_TRANSACTION_BODY_VERSION_NUMBER,
        type,
        otherGroup,
      })
    } else {
      super()
    }
  }

  @Field.d(1, 'string')
  public memo: string

  @Field.d(2, Timestamp)
  public createdAt: Timestamp

  @Field.d(3, 'string')
  public versionNumber: string

  @Field.d(4, CrossGroupType)
  public type: CrossGroupType

  @Field.d(5, 'string')
  public otherGroup: string

  @OneOf.d(
    'gradidoTransfer',
    'gradidoCreation',
    'groupFriendsUpdate',
    'registerAddress',
    'gradidoDeferredTransfer',
    'communityRoot',
  )
  public data: string

  @Field.d(6, 'GradidoTransfer')
  transfer?: GradidoTransfer

  @Field.d(7, 'GradidoCreation')
  creation?: GradidoCreation

  @Field.d(8, 'GroupFriendsUpdate')
  groupFriendsUpdate?: GroupFriendsUpdate

  @Field.d(9, 'RegisterAddress')
  registerAddress?: RegisterAddress

  @Field.d(10, 'GradidoDeferredTransfer')
  deferredTransfer?: GradidoDeferredTransfer

  @Field.d(11, 'CommunityRoot')
  communityRoot?: CommunityRoot

  public getTransactionType(): TransactionType | undefined {
    if (this.transfer) return TransactionType.GRADIDO_TRANSFER
    else if (this.creation) return TransactionType.GRADIDO_CREATION
    else if (this.groupFriendsUpdate) return TransactionType.GROUP_FRIENDS_UPDATE
    else if (this.registerAddress) return TransactionType.REGISTER_ADDRESS
    else if (this.deferredTransfer) return TransactionType.GRADIDO_DEFERRED_TRANSFER
    else if (this.communityRoot) return TransactionType.COMMUNITY_ROOT
  }

  // The `TransactionBody` class utilizes Protobuf's `OneOf` field structure which, according to Protobuf documentation
  // (https://protobuf.dev/programming-guides/proto3/#oneof), allows only one field within the group to be set at a time.
  // Therefore, accessing the `getTransactionDetails()` method returns the first initialized value among the defined fields,
  // each of which should be of type AbstractTransaction. It's important to note that due to the nature of Protobuf's `OneOf`,
  // only one type from the defined options can be set within the object obtained from Protobuf.
  //
  // If multiple fields are set in a single object, the method `getTransactionDetails()` will return the first defined value
  // based on the order of checks. Developers should handle this behavior according to the expected Protobuf structure.
  public getTransactionDetails(): AbstractTransaction | undefined {
    if (this.transfer) return this.transfer
    if (this.creation) return this.creation
    if (this.groupFriendsUpdate) return this.groupFriendsUpdate
    if (this.registerAddress) return this.registerAddress
    if (this.deferredTransfer) return this.deferredTransfer
    if (this.communityRoot) return this.communityRoot
  }

  public fillTransactionRecipe(recipe: Transaction): void {
    recipe.createdAt = timestampToDate(this.createdAt)
    recipe.protocolVersion = this.versionNumber
    const transactionType = this.getTransactionType()
    if (!transactionType) {
      throw new LogError("invalid TransactionBody couldn't determine transaction type")
    }
    recipe.type = transactionType.valueOf()
    this.getTransactionDetails()?.fillTransactionRecipe(recipe)
  }

  public getRecipientPublicKey(): Buffer | undefined {
    if (this.transfer) {
      // this.transfer.recipient contains the publicKey of the recipient
      return this.transfer.recipient
    }
    if (this.creation) {
      return this.creation.recipient.pubkey
    }
    if (this.deferredTransfer) {
      // this.deferredTransfer.transfer.recipient contains the publicKey of the recipient
      return this.deferredTransfer.transfer.recipient
    }
    return undefined
  }
}
