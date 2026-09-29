// AI-GENERATED — not an architecture reference
import { ChatConversationMemberRole } from 'database'
import { registerEnumType } from 'type-graphql'

export { ChatConversationMemberRole as ChatGroupRole }

// The object the role column is typed by (drizzle.schema.ts): one list of values for the column
// and for the schema, as ChatMessageNotify is.
registerEnumType(ChatConversationMemberRole, {
  name: 'ChatGroupRole',
  description: "A member's part in a chat group: its owner, one of its moderators, or a member",
})
