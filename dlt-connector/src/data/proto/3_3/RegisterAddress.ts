/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Account } from '@entity/Account'
import { Transaction } from '@entity/Transaction'
import { User } from '@entity/User'
import { Field, Message } from 'protobufjs'

import { AddressType } from '@/data/proto/3_3/enum/AddressType'
import { AccountType } from '@/graphql/enum/AccountType'
import { UserAccountDraft } from '@/graphql/input/UserAccountDraft'
import { accountTypeToAddressType } from '@/utils/typeConverter'

import { AbstractTransaction } from '../AbstractTransaction'

// https://www.npmjs.com/package/@apollo/protobufjs
// eslint-disable-next-line no-use-before-define
export class RegisterAddress extends Message<RegisterAddress> implements AbstractTransaction {
  constructor(transaction?: UserAccountDraft, account?: Account) {
    if (transaction) {
      super({ addressType: accountTypeToAddressType(transaction.accountType) })
      if (account) {
        this.derivationIndex = account.derivationIndex
        this.accountPubkey = account.derive2Pubkey
        if (account.user) {
          this.userPubkey = account.user.derive1Pubkey
        }
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

  public fillTransactionRecipe(_recipe: Transaction): void {}
}
