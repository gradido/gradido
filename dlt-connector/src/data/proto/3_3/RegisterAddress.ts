/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Account } from '@entity/Account'
import { Transaction } from '@entity/Transaction'
import { User } from '@entity/User'
import { Field, Message } from 'protobufjs'

import { AddressType } from '@/data/proto/3_3/enum/AddressType'
import { AccountType } from '@/graphql/enum/AccountType'
import { TransactionValidationLevel } from '@/graphql/enum/TransactionValidationLevel'
import { UserAccountDraft } from '@/graphql/input/UserAccountDraft'
import { accountTypeToAddressType } from '@/utils/typeConverter'

import { AbstractTransaction } from '../AbstractTransaction'

// https://www.npmjs.com/package/@apollo/protobufjs
// eslint-disable-next-line no-use-before-define
export class RegisterAddress extends Message<RegisterAddress> implements AbstractTransaction {
  constructor(transaction?: UserAccountDraft, user?: User, account?: Account) {
    if (transaction) {
      super({ addressType: accountTypeToAddressType(transaction.accountType) })
      if (account) {
        this.derivationIndex = account.derivationIndex
      }
      if (account && transaction.accountType === AccountType.SUBACCOUNT) {
        this.accountPubkey = account.derive2Pubkey
      }
      if (user && account) {
        this.userPubkey = user.derive1Pubkey
        this.accountPubkey = account?.derive2Pubkey
      }
    } else {
      super()
    }
  }

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

  public validate(level: TransactionValidationLevel): boolean {
    throw new Error('Method not implemented.')
  }

  public fillTransactionRecipe(_recipe: Transaction): void {}
}