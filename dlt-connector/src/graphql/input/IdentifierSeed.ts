import { IsString } from 'class-validator'
import { InputType, Field } from 'type-graphql'

@InputType()
export class IdentifierSeed {
  @Field(() => String)
  @IsString()
  seed: string
}
