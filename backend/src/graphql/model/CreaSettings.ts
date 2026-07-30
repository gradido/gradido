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

  // Faster output at premium pricing, where the chosen model supports it.
  @Field()
  fastMode: boolean
}

// Result of the admin "test model" probe: whether a tiny call to the chosen model
// succeeded, plus a human-readable message (the model's reply, or the error).
@ObjectType()
export class CreaModelTestResult {
  @Field()
  ok: boolean

  // Outcome code, rendered into a sentence by the admin via i18n. The backend carries
  // no user-facing prose: it does not know the moderator's language.
  // 'ok' | 'api_inactive' | 'error'
  @Field()
  code: string

  // Payload only - the model's own answer, or the API's error text. Never our wording.
  @Field()
  message: string

  // Fast-mode outcome: 'off' | 'active' | 'rate_limited' | 'refused'.
  @Field()
  fastMode: string

  // The API's own wording when it refused fast mode; empty otherwise.
  @Field()
  fastModeDetail: string
}
