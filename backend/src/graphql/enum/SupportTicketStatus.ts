// AI-GENERATED — not an architecture reference
import { SupportTicketStatus } from 'database'
import { registerEnumType } from 'type-graphql'

export { SupportTicketStatus }

// The object the status column is typed by (drizzle.schema.ts): one list of values for the
// column and for the schema.
registerEnumType(SupportTicketStatus, {
  name: 'SupportTicketStatus',
  description:
    'The state of a support request: open, a question back to the member, closed, deleted',
})
