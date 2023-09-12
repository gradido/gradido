import { Field, Message, OneOf } from '@apollo/protobufjs'

import { CrossGroupType } from './enum/CrossGroupType'

import { Timestamp } from './Timestamp'
import { GradidoTransfer } from './GradidoTransfer'
import { GradidoCreation } from './GradidoCreation'
import { GradidoDeferredTransfer } from './GradidoDeferredTransfer'
import { GroupFriendsUpdate } from './GroupFriendsUpdate'
import { RegisterAddress } from './RegisterAddress'
import { TransactionDraft } from '@/graphql/input/TransactionDraft'
import { determineCrossGroupType, determineOtherGroup } from '@/controller/TransactionBody'
import { CommunityRoot } from './CommunityRoot'
import { CommunityDraft } from '@/graphql/input/CommunityDraft'

// https://www.npmjs.com/package/@apollo/protobufjs
// eslint-disable-next-line no-use-before-define
export class TransactionBody extends Message<TransactionBody> {
  public constructor(transaction: TransactionDraft | CommunityDraft) {
    let type = CrossGroupType.LOCAL
    let otherGroup = ''
    if (transaction instanceof TransactionDraft) {
      type = determineCrossGroupType(transaction)
      otherGroup = determineOtherGroup(type, transaction)
    }

    super({
      memo: 'Not implemented yet',
      createdAt: new Timestamp(new Date(transaction.createdAt)),
      versionNumber: '3.3',
      type,
      otherGroup,
    })
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
}
