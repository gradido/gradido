// AI-GENERATED — not an architecture reference
import { IsDate } from 'class-validator'
import { ArgsType, Field } from 'type-graphql'

// TODO: replace the class-validator decorator with a valibot schema

@ArgsType()
export class CommunityFiguresArgs {
  /** The moment the first column of the figures counts from. */
  @Field(() => Date)
  @IsDate()
  since: Date
}
