// AI-GENERATED — not an architecture reference
import { SupportTicketMessageType } from 'database'
import { registerEnumType } from 'type-graphql'

export { SupportTicketMessageType }

// The object the type column of a support request's thread is typed by (drizzle.schema.ts).
registerEnumType(SupportTicketMessageType, {
  name: 'SupportTicketMessageType',
  description:
    'The kind of a message in a support request: dialog, the moderation internal note, or the line a handing on to another group leaves',
})
