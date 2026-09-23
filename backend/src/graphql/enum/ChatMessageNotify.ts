// AI-GENERATED — not an architecture reference
import { ChatMessageNotify } from 'database'
import { registerEnumType } from 'type-graphql'

export { ChatMessageNotify }

// The object the notify column is typed by (drizzle.schema.ts): one list of values for the
// column and for the schema.
registerEnumType(ChatMessageNotify, {
  name: 'ChatMessageNotify',
  description: 'Whether the sender asked for the message to go out as a mail as well',
})
