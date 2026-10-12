// AI-GENERATED — not an architecture reference
import { CHAT_REACTION_EMOJI_ROWS } from 'shared'
import * as v from 'valibot'

/**
 * The emoji a member may react to a chat message with (setChatMessageReaction): one of the
 * wallet's forty-eight, exactly as it stands in the list -- a sign of two code points with its
 * selector. Anything else is no reaction: a word, two emoji, a sign the wallets do not offer and
 * some of them would draw as an empty box.
 *
 * ⛔ Its message quotes nothing of what was sent: a message can end up in the error log, and
 * valibot's own messages do quote (as transactionPictureSchema says of its own).
 */
export const chatReactionEmojiSchema = v.picklist(
  CHAT_REACTION_EMOJI_ROWS.flat(),
  'Chat reaction: not one of the emoji',
)

export type ChatReactionEmoji = v.InferOutput<typeof chatReactionEmojiSchema>
