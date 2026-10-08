// AI-GENERATED — not an architecture reference
import { IsBoolean, IsUUID } from 'class-validator'
import { ArgsType, Field } from 'type-graphql'

// TODO: replace the class-validator decorators with a valibot schema

/** The group, muted or not (E-024): no announcement reaches a member who muted it. */
@ArgsType()
export class SetChatGroupMutedArgs {
  @Field(() => String)
  @IsUUID('4')
  groupUuid: string

  @Field(() => Boolean)
  @IsBoolean()
  muted: boolean
}
