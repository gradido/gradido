// AI-GENERATED — not an architecture reference
import { IsEmail, IsString } from 'class-validator'
import { ArgsType, Field } from 'type-graphql'

@ArgsType()
export class CompleteAssistedRegistrationArgs {
  @Field(() => String)
  @IsString()
  assistCode: string

  // The guest's OWN address — the host's address never becomes an account address.
  @Field(() => String)
  @IsEmail()
  email: string

  @Field(() => String)
  @IsString()
  password: string
}
