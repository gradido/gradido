// AI-GENERATED — not an architecture reference

/**
 * The parts a member plays in a chat group (P5), as the server names them: the GraphQL enum
 * `ChatGroupRole`, which goes over the wire by its NAME. The wallet does not import `shared`, so
 * they are strings here, pinned by the specs.
 *
 * A module of its own, with no imports: the thread and the compose bar ask who may announce, and
 * their specs must not have to stand in for the display helpers to do so.
 */
export const CHAT_GROUP_OWNER = 'OWNER'
export const CHAT_GROUP_MODERATOR = 'MODERATOR'
export const CHAT_GROUP_MEMBER = 'MEMBER'

/**
 * Whether a member in this part may take people in, take them out, rename the group and write an
 * announcement (E-050 F4, F5): the owner and the moderators.
 */
export const managesChatGroup = (role) => role === CHAT_GROUP_OWNER || role === CHAT_GROUP_MODERATOR
