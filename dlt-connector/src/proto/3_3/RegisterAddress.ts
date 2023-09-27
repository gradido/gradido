import { Field, Message } from '@apollo/protobufjs'

import { AddressType } from './enum/AddressType'
import { TransactionBase } from '@/controller/TransactionBase'
import { TransactionValidationLevel } from '@/graphql/enum/TransactionValidationLevel'
import { TransactionRecipe } from '@entity/TransactionRecipe'

// https://www.npmjs.com/package/@apollo/protobufjs
// eslint-disable-next-line no-use-before-define
export class RegisterAddress extends Message<RegisterAddress> implements TransactionBase {
  @Field.d(1, 'bytes')
  public userPubkey: Buffer

  @Field.d(2, 'AddressType')
  public addressType: AddressType

  @Field.d(3, 'bytes')
  public nameHash: Buffer

  @Field.d(4, 'bytes')
  public subaccountPubkey: Buffer

  public validate(level: TransactionValidationLevel): boolean {
    throw new Error('Method not implemented.')
  }

  public fillTransactionRecipe(recipe: TransactionRecipe): void {
    throw new Error('Method not implemented.')
  }
}
