// AI-GENERATED — not an architecture reference
import { IsBoolean, IsInt } from 'class-validator'
import { Field, InputType, Int } from 'type-graphql'

// TODO: replace the class-validator decorators with a valibot schema

/**
 * One column of "Meine Gruppen" as the admin sends it (MG5): the groups by number, whether "no
 * group" is among them, and whether an administrator handles nothing of its kind (`off`).
 *
 * ⛔ The decorators are what makes it valid at all: class-validator gets every argument of a class,
 * and refuses one whose class carries none (`forbidUnknownValues`, ThankYouCardSettingsArgs). How
 * many groups a choice may name is the rule's to say (normaliseHandledCreationGroups).
 */
@InputType()
export class HandledGroupsInput {
  @Field(() => [Int])
  @IsInt({ each: true })
  groupIds: number[]

  @Field(() => Boolean)
  @IsBoolean()
  untagged: boolean

  @Field(() => Boolean)
  @IsBoolean()
  off: boolean
}
