// AI-GENERATED — not an architecture reference
import { IsUUID } from 'class-validator'
import { ArgsType, Field } from 'type-graphql'

// TODO: replace the class-validator decorators with a valibot schema after the update to
// typescript 5 is possible

/** Which group (P5): by the uuid it is known by, to the wallet and in the links of its mails. */
@ArgsType()
export class ChatGroupArgs {
  @Field(() => String)
  @IsUUID('4')
  groupUuid: string
}
