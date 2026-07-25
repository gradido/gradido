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

  // The salutation the code resolved for this participant — a stored one if there is
  // one, otherwise the first-name heuristic. The reply still carries the [ANREDE]
  // placeholder; the client fills it with this and lets the moderator change it
  // (E-013). Sent to the client, never to the model.
  @Field()
  salutation: string

  // What the name heuristic alone would say, ignoring any stored salutation. The
  // client shows it as the field's hint and falls back to it whenever the field is
  // empty, so an emptied field renders a usable reply instead of a bare placeholder.
  @Field()
  defaultSalutation: string

  @Field(() => [CreaOpenPoint])
  openPoints: CreaOpenPoint[]

  @Field(() => [String])
  flags: string[]
}
