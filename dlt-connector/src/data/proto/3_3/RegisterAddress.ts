/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Transaction } from '@entity/Transaction'
import { Field, Message } from 'protobufjs'

import { AddressType } from '@/data/proto/3_3/enum/AddressType'

import { AbstractTransaction } from '../AbstractTransaction'

// https://www.npmjs.com/package/@apollo/protobufjs
// eslint-disable-next-line no-use-before-define
export class RegisterAddress extends Message<RegisterAddress> implements AbstractTransaction {
  @Field.d(1, 'bytes')
  public userPubkey: Buffer

  @Field.d(2, AddressType)
  public addressType: AddressType

  @Field.d(3, 'bytes')
  public nameHash: Buffer

  @Field.d(4, 'bytes')
  public accountPubkey: Buffer

  @Field.d(5, 'uint32')
  public derivationIndex?: number

  public fillTransactionRecipe(_recipe: Transaction): void {}
}
