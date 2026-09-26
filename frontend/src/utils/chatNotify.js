// AI-GENERATED — not an architecture reference

/**
 * The sender's wish for one chat message (E-024), as the server takes it for `notify`: the
 * enum NAMES of `ChatMessageNotify`, not the values the column stores. The server decides the
 * rest -- the first message of a pair goes out as a mail whatever is asked, and a recipient who
 * muted the conversation gets none (E-034).
 *
 * One place for both ways a message is written from the wallet -- the compose bar and the video
 * invitation of the contact window (V2) -- so the two cannot come to spell the names, or the rule,
 * differently.
 */
export const CHAT_NOTIFY_EMAIL = 'EMAIL'
export const CHAT_NOTIFY_NONE = 'NONE'

/**
 * EMAIL for the first message of a pair and where the sender ticked "Also by e-mail", NONE
 * otherwise. The first message mails whatever is asked (the server sets it); asking for it as
 * well keeps the request honest about what will happen.
 *
 * @param {{ first: boolean, alsoByEmail: boolean }} wish
 * @returns {'EMAIL' | 'NONE'}
 */
export const chatNotifyFor = ({ first, alsoByEmail }) =>
  first || alsoByEmail ? CHAT_NOTIFY_EMAIL : CHAT_NOTIFY_NONE
