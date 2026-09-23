// AI-GENERATED — not an architecture reference
import { ChatMessageDeliveryState } from 'database'
import { registerEnumType } from 'type-graphql'

export { ChatMessageDeliveryState }

// The object the delivery_state column is typed by (drizzle.schema.ts): one list of values
// for the column and for the schema.
registerEnumType(ChatMessageDeliveryState, {
  name: 'ChatMessageDeliveryState',
  description: "Whether the caller's own copy of a message reached the other server",
})
