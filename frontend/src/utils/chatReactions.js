// AI-GENERATED — not an architecture reference

/**
 * Reactions to chat messages (Bernd, 11.10.2026): a member answers a message with an emoji, one a
 * member and message, and everybody in the conversation sees it at the message.
 */

/**
 * The six a press away, in the menu at a message -- Bernd's own set. Behind them "mehr" opens
 * all forty-eight (utils/emojiChoice, EMOJI_ROWS); each of the six is one of those, sign for sign
 * (the spec holds it), and the server takes no other.
 */
export const CHAT_QUICK_REACTIONS = Object.freeze(['👍', '❤️', '🙏', '😊', '🎉', '🌱'])

/** When the reactions to a message were changed last, as a number; NaN for one never reacted to. */
const reactedAt = (message) => Date.parse(message?.reactedAt ?? '')

/**
 * Whether `now` holds an earlier state of a message's reactions than `held`: changed before it --
 * or never, where the held one was. Two answers of the server can pass each other on their way:
 * the beat read the message before one's own reaction to it and comes in after that reaction's
 * answer.
 */
export const isEarlierReactionState = (now, held) => {
  const heldAt = reactedAt(held)
  if (Number.isNaN(heldAt)) return false
  const nowAt = reactedAt(now)
  return Number.isNaN(nowAt) || nowAt < heldAt
}

const sameReactions = (a, b) => {
  const one = a.reactions ?? []
  const other = b.reactions ?? []
  return (
    (a.reactedAt ?? null) === (b.reactedAt ?? null) &&
    one.length === other.length &&
    one.every(
      (reaction, index) =>
        reaction.emoji === other[index].emoji &&
        reaction.count === other[index].count &&
        reaction.mine === other[index].mine,
    )
  )
}

/**
 * A page of a thread with the reactions of `reacted` in the place of the ones its messages hold,
 * by their id -- and which messages were in fact given other reactions: the same state comes
 * again with the next beats for some seconds, and is no news then.
 *
 * ⛔ Only the reactions and their moment are taken. The text stays as the page holds it: an
 * answer about reactions may be older than a change of the text the page has already (the two
 * come by different clocks), and must not take the words back.
 *
 * Messages the page does not hold are passed over: a page loaded later brings them as they stand.
 * So is a state earlier than the one the page holds (`isEarlierReactionState`). Of two states of
 * the same message in `reacted`, the later one counts.
 *
 * @param {object[]} held the messages of the page
 * @param {object[]} reacted messages whose reactions changed, of any conversation
 * @returns {{ messages: object[], changed: object[] }} `messages` is `held` itself where nothing changed
 */
export const withChatMessagesReacted = (held, reacted) => {
  const byId = new Map()
  for (const message of reacted) {
    const before = byId.get(message.id)
    if (!before || !isEarlierReactionState(message, before)) byId.set(message.id, message)
  }
  const changed = []
  const messages = held.map((message) => {
    const now = byId.get(message.id)
    if (!now || sameReactions(now, message) || isEarlierReactionState(now, message)) return message
    const next = { ...message, reactions: now.reactions ?? [], reactedAt: now.reactedAt ?? null }
    changed.push(next)
    return next
  })
  return { messages: changed.length > 0 ? messages : held, changed }
}

/**
 * A message that takes the place of the one a thread holds -- its text was changed -- with the
 * reactions of the held one where those are the later state: the change of a text is read by
 * another clock, and its answer may have left the server before a reaction that is here already.
 */
export const keepingLaterReactions = (now, held) =>
  isEarlierReactionState(now, held)
    ? { ...now, reactions: held.reactions ?? [], reactedAt: held.reactedAt ?? null }
    : now

/** The emoji the member reacted to this message with themselves, or null. */
export const ownChatReaction = (message) =>
  message?.reactions?.find((reaction) => reaction.mine)?.emoji ?? null

/**
 * What a press on an emoji asks the server for: the emoji -- or none where it is the member's
 * own reaction already: the same one again takes it back.
 */
export const chatReactionToSend = (message, emoji) =>
  ownChatReaction(message) === emoji ? null : emoji

/**
 * Whether a conversation is one a member may react in: every member of it in this community. A
 * person of another community reads a copy on their own server, and a reaction has no way there
 * yet (the server refuses it: CHAT_REACTION_NOT_SET: OTHER_COMMUNITY) -- so the wallet does not
 * offer what would be seen on one side only.
 *
 * `person`: the other member of a conversation of two, `{ communityUuid }` -- a community of null
 * is this one, as the server reads it. A group has only members of its own community (P5).
 * Where the member's own community is not known, nothing says the person is of another.
 */
export const offersChatReactions = (person, ownCommunityUuid) => {
  const theirs = person?.communityUuid
  if (!theirs || !ownCommunityUuid) return true
  return String(theirs).toLowerCase() === String(ownCommunityUuid).toLowerCase()
}
