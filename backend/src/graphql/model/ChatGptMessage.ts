import { Field, ObjectType } from 'type-graphql'

import { Message } from '@/apis/openai/model/Message'

@ObjectType()
export class ChatGptMessage {
  @Field()
  content: string

  @Field()
  role: string

  @Field({ nullable: true })
  threadId?: string

  @Field()
  isError: boolean

  public constructor(data: Partial<Message>, isError: boolean = false) {
    Object.assign(this, data)
    this.isError = isError
  }
}
