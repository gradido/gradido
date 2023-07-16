import { MessageWrapper } from '@iota/client/lib/types/message'
import { Field, ObjectType } from 'type-graphql'

@ObjectType()
export class TransmitTransactionResult {
  constructor(iotaMessage: MessageWrapper) {
    this.dltTransactionIdHex = iotaMessage.messageId
  }

  @Field()
  dltTransactionIdHex: string
}
