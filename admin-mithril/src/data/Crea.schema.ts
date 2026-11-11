// AI-GENERATED — not an architecture reference
import * as v from 'valibot'

/** Crea's evaluation of one contribution or of several together: advice, never a decision. */
export const creaEvaluationSchema = v.object({
  overallVerdict: v.string(),
  reasoning: v.nullable(v.string()),
  // with [ANREDE] and [SIGNATUR], filled in here: the names never reach the API
  responseText: v.string(),
  defaultSalutation: v.nullable(v.string()),
  openPoints: v.array(v.object({ question: v.string(), options: v.array(v.string()) })),
  flags: v.nullable(v.array(v.string())),
  model: v.string(),
})

export type CreaEvaluation = v.InferOutput<typeof creaEvaluationSchema>

/** A reply written anew for the moderator's own decision; a confirmation with a public note. */
export const creaRewriteSchema = v.object({
  responseText: v.string(),
  memoSupplement: v.nullable(v.string()),
  model: v.string(),
})
