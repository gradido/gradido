// AI-GENERATED — not an architecture reference
import { Field, Int, ObjectType } from 'type-graphql'

/**
 * One figure of the admin's start page, in its three columns: from the chosen day on, the last
 * seven days, and all of it. A column the figure does not have is null -- the page shows a dash.
 *
 * `key` names the figure, and the page finds its label by it: a new figure is a new key and a
 * new line in the language files, and this type stays as it is.
 */
@ObjectType()
export class CommunityFigure {
  @Field(() => String)
  key: string

  @Field(() => Int, { nullable: true })
  since: number | null

  @Field(() => Int, { nullable: true })
  week: number | null

  @Field(() => Int, { nullable: true })
  total: number | null
}

@ObjectType()
export class CommunityFigures {
  /** The day the first column counts from, as it was asked for. */
  @Field(() => Date)
  since: Date

  @Field(() => [CommunityFigure])
  rows: CommunityFigure[]
}
