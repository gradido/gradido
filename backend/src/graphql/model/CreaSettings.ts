import { Field, ObjectType } from 'type-graphql'

// The global Crea runtime settings shown in the admin panel (DO-4). `model` is the
// stored override (null = the env default is in use); `defaultModel` is that env
// fallback, shown as the field's placeholder; `effort` is the reasoning level
// (disabled | low | medium | high | xhigh | max).
@ObjectType()
export class CreaSettings {
  @Field(() => String, { nullable: true })
  model: string | null

  @Field()
  effort: string

  @Field()
  defaultModel: string
}

// Result of the admin "test model" probe: whether a tiny call to the chosen model
// succeeded, plus a human-readable message (the model's reply, or the error).
@ObjectType()
export class CreaModelTestResult {
  @Field()
  ok: boolean

  @Field()
  message: string
}
