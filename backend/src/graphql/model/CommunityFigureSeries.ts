// AI-GENERATED — not an architecture reference
import { Field, Int, ObjectType } from 'type-graphql'

/**
 * One flow of the admin's start page by calendar week: a number for each week, in the order of
 * `weeks` and as many. `key` is the key of the same figure in the table above (CommunityFigure),
 * and the page finds its label by it.
 */
@ObjectType()
export class CommunityFigureSeriesRow {
  @Field(() => String)
  key: string

  @Field(() => [Int])
  counts: number[]
}

@ObjectType()
export class CommunityFigureSeries {
  /**
   * The moment the weeks were asked from, as it was asked for: the first week is the one it lies
   * in, unless that lies more than two years back (WEEKS_AT_MOST).
   */
  @Field(() => Date)
  since: Date

  /** The Monday each week begins with, 00:00 UTC, up to the running week, which is not over yet. */
  @Field(() => [Date])
  weeks: Date[]

  @Field(() => [CommunityFigureSeriesRow])
  rows: CommunityFigureSeriesRow[]
}
