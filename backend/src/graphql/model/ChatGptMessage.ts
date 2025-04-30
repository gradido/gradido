import { Field, ObjectType } from 'type-graphql'

import { Message } from '@/apis/openai/model/Message'

@ObjectType()
export class ChatGptMessage {
  @Field()
  content: string

  @Field()
  role: string

  @Field()
  threadId: string

  public constructor(data: Partial<Message>) {
    Object.assign(this, data)
  }
}
