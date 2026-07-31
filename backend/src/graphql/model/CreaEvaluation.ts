import { Field, Float, ObjectType } from 'type-graphql'

// Crea's structured evaluation of a contribution (design doc `H`).
// Enum-valued fields are typed as String here; their allowed values are
// enforced by the Anthropic output schema (`CREA_OUTPUT_SCHEMA`). Dedicated
// GraphQL enums can follow once the admin UI (DO-4) needs them.

@ObjectType()
export class CreaActivity {
  @Field()
  activity: string

  @Field()
  categoryKey: string

  @Field()
  outputType: string

  @Field(() => Float)
  hours: number

  @Field()
  hoursEstimated: boolean

  @Field()
  verdict: string

  @Field()
  confidence: string
}

@ObjectType()
export class CreaOpenPoint {
  @Field()
  question: string

  @Field(() => [String])
  options: string[]

  @Field()
  relatesTo: string
}

@ObjectType()
export class CreaEvaluation {
  @Field()
  beitragRef: string

  @Field(() => [CreaActivity])
  activities: CreaActivity[]

  @Field()
  overallVerdict: string

  @Field()
  discrepancy: string

  @Field()
  appliedRule: string

  @Field()
  confidence: string

  @Field()
  reasoning: string

  @Field()
  responseText: string

  // What the name heuristic alone says, ignoring any stored salutation. The reply still
  // carries the [ANREDE] placeholder; the client fills it with the moderator's own entry,
  // or with this when that entry is empty, so an emptied field still renders a usable
  // reply instead of a bare placeholder (E-013). The stored salutation is deliberately
  // NOT returned: the client reads that from the participant's record, where it can tell
  // "nothing stored" apart from "stored", which one merged value cannot.
  @Field()
  defaultSalutation: string

  @Field(() => [CreaOpenPoint])
  openPoints: CreaOpenPoint[]

  @Field(() => [String])
  flags: string[]
}
