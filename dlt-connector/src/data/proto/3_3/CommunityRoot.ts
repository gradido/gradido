import { AbstractTransaction } from '../AbstractTransaction'
import { TransactionValidationLevel } from '@/graphql/enum/TransactionValidationLevel'
import { Field, Message } from 'protobufjs'
import { Community } from '@entity/Community'
import { Transaction } from '@entity/Transaction'

// https://www.npmjs.com/package/@apollo/protobufjs
// eslint-disable-next-line no-use-before-define
export class CommunityRoot extends Message<CommunityRoot> implements AbstractTransaction {
  public constructor(community?: Community) {
    if (community) {
      super({
        rootPubkey: community.rootPubkey,
        gmwPubkey: community.gmwAccount?.derive2Pubkey,
        aufPubkey: community.aufAccount?.derive2Pubkey,
      })
    } else {
      super()
    }
  }

  @Field.d(1, 'bytes')
  public rootPubkey: Buffer

  // community public budget account
  @Field.d(2, 'bytes')
  public gmwPubkey: Buffer

  // community compensation and environment founds account
  @Field.d(3, 'bytes')
  public aufPubkey: Buffer

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public validate(_level: TransactionValidationLevel): boolean {
    throw new Error('Method not implemented.')
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars
  public fillTransactionRecipe(recipe: Transaction): void {}
}
