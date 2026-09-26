// AI-GENERATED — not an architecture reference
import { ChatMessageMailState } from 'database'
import { registerEnumType } from 'type-graphql'

export { ChatMessageMailState }

// The object the mail_state column is typed by (drizzle.schema.ts): one list of values for the
// column and for the schema.
registerEnumType(ChatMessageMailState, {
  name: 'ChatMessageMailState',
  description:
    "What became of the mail about the caller's own message: mailed, or asked for and muted by the recipient",
})
