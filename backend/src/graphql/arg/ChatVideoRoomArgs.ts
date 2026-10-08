// AI-GENERATED — not an architecture reference
import { IsInt, IsPositive } from 'class-validator'
import { ArgsType, Field, Int } from 'type-graphql'

// TODO: replace the class-validator decorators with a valibot schema

/** Where a video room is wanted (V5). */
@ArgsType()
export class ChatVideoRoomArgs {
  /**
   * The server the member chose -- an `id` of chatVideoServerChoices. Absent: one of the servers
   * that answer, at random, as before (V1).
   */
  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsPositive()
  serverId?: number | null
}
