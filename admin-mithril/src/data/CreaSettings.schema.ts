// AI-GENERATED — not an architecture reference
import * as v from 'valibot'

/** Who confirms every first creation in the community's name, and whether they still can. */
export const firstCreationSignerSchema = v.object({
  userId: v.number(),
  firstName: v.nullable(v.string()),
  lastName: v.nullable(v.string()),
  alias: v.nullable(v.string()),
  role: v.nullable(v.string()),
  eligible: v.boolean(),
  // a code, worded here
  reason: v.string(),
})

export type FirstCreationSigner = v.InferOutput<typeof firstCreationSignerSchema>

/** Crea's settings for the whole community. */
export const creaSettingsSchema = v.object({
  // null: the default model
  model: v.nullable(v.string()),
  effort: v.string(),
  defaultModel: v.string(),
  fastMode: v.boolean(),
  matchingKeyingActive: v.boolean(),
  firstCreationSigner: v.nullable(firstCreationSignerSchema),
})

/** What saving the moderation's settings answers: those three, and the default model. */
export const savedCreaSettingsSchema = v.pick(creaSettingsSchema, [
  'model',
  'effort',
  'defaultModel',
  'fastMode',
])

/** A test of the model: codes and the model's words, worded here. */
export const creaModelTestSchema = v.object({
  ok: v.boolean(),
  code: v.string(),
  message: v.string(),
  fastMode: v.string(),
  fastModeDetail: v.string(),
})

export type CreaModelTest = v.InferOutput<typeof creaModelTestSchema>
