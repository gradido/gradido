import { IsOptional, IsString } from 'class-validator'
import { Field, InputType } from 'type-graphql'

/** One message the moderator sends to Crea. An empty threadId opens a new thread. */
@InputType()
export class CreaChatInput {
  @Field()
  @IsString()
  message: string

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  threadId?: string | null
}
