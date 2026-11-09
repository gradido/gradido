// AI-GENERATED — not an architecture reference
import * as v from 'valibot'

/** A message of Crea's chat; an error is a code, worded here, and carries no conversation. */
export const chatMessageSchema = v.object({
  content: v.string(),
  role: v.picklist(['user', 'assistant']),
  threadId: v.nullable(v.string()),
  errorCode: v.nullable(v.string()),
})

export type ChatMessage = v.InferOutput<typeof chatMessageSchema>
