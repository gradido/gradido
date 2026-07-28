import { Field, ObjectType } from 'type-graphql'
import { CreaOpenPoint } from './CreaEvaluation'

// Slim result of the batch evaluation (E-020): several open contributions of one
// participant judged into ONE overall verdict + ONE reply. No per-activity data
// (activities / appliedRule / discrepancy) - those belong to the single-contribution
// path that persists records; batch mode stays lean. Field names match CreaEvaluation
// so the admin modal can render both the same way.
@ObjectType()
export class CreaBatchEvaluation {
  @Field()
  overallVerdict: string

  @Field()
  confidence: string

  @Field()
  reasoning: string

  @Field()
  responseText: string

  @Field(() => [CreaOpenPoint])
  openPoints: CreaOpenPoint[]

  @Field(() => [String])
  flags: string[]
}
