import { IsOptional, IsString } from 'class-validator'
import { Field, InputType } from 'type-graphql'

@InputType()
export class OpenaiMessage {
  @Field()
  @IsString()
  message: string

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  threadId?: string | null
}
