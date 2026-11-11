// AI-GENERATED — not an architecture reference
import * as v from 'valibot'

/** The last check of a server: whether it answered, why not, and how often it was handed out. */
export const serverCheckSchema = v.object({
  ok: v.boolean(),
  reason: v.nullable(v.string()),
  checkedAt: v.pipe(
    v.string(),
    v.isoTimestamp(),
    v.transform((at) => new Date(at)),
  ),
  latencyMs: v.nullable(v.number()),
  picks: v.number(),
})

/** A Jitsi server the chat's video calls take a room from. */
export const chatVideoServerSchema = v.object({
  id: v.number(),
  baseUrl: v.string(),
  host: v.string(),
  operator: v.nullable(v.string()),
  roomPrefix: v.nullable(v.string()),
  note: v.nullable(v.string()),
  active: v.boolean(),
  check: v.nullable(serverCheckSchema),
})
export type ChatVideoServer = v.InferOutput<typeof chatVideoServerSchema>
export type ServerCheck = v.InferOutput<typeof serverCheckSchema>

/** What the fields of a server hold, as typed. */
export type ServerValues = { baseUrl: string; operator: string; roomPrefix: string; note: string }
