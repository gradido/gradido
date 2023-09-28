import { Field, Message } from '@apollo/protobufjs'

import { AddressType } from './enum/AddressType'
import { TransactionBase } from '@/controller/TransactionBase'
import { TransactionValidationLevel } from '@/graphql/enum/TransactionValidationLevel'
import { TransactionRecipe } from '@entity/TransactionRecipe'
import { UserAccountDraft } from '@/graphql/input/UserAccountDraft'
import { User } from '@entity/User'
import { accountTypeToAddressType } from '@/utils/typeConverter'
import { AccountType } from '@/graphql/enum/AccountType'
import { Account } from '@entity/Account'

// https://www.npmjs.com/package/@apollo/protobufjs
// eslint-disable-next-line no-use-before-define
export class RegisterAddress extends Message<RegisterAddress> implements TransactionBase {
  constructor(transaction?: UserAccountDraft, user?: User, account?: Account) {
    if (transaction) {
      super({ addressType: accountTypeToAddressType(transaction.accountType) })
      if (account && transaction.accountType === AccountType.SUBACCOUNT) {
        this.subaccountPubkey = account.derive2Pubkey
      }
      if (user) {
        this.userPubkey = user.derive1Pubkey
      }
    } else {
      super()
    }
  }

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

  // eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars
  public fillTransactionRecipe(recipe: TransactionRecipe): void {}
}
