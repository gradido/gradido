// AI-GENERATED — not an architecture reference
import { isComputer } from '@/utils/isComputer'

/**
 * The emoji the wallet offers beside a text field (Bernd, 10.10.2026): forty-eight chosen ones,
 * six rows of eight, no search and no library. Whoever wants another one has the device's own
 * keyboard for it, and the choice says where that is (EmojiPicker).
 *
 * ⛔ Every one of them is old and plain, and that is what keeps the choice whole on every device:
 * nothing newer than Unicode 11 (2018) -- an older phone or computer draws a newer emoji as an
 * empty box --, no flag (Windows draws two letters), no skin tone and nothing joined out of
 * several (one sign, at most with the selector that asks for the coloured drawing). The spec
 * holds the count and the plainness; the age is held by this list.
 *
 * The rows, for whoever changes one: joy · feelings · hands · hearts · nature and feasts ·
 * everyday.
 */
export const EMOJI_ROWS = Object.freeze([
  Object.freeze(['🙂', '😊', '😄', '😂', '🤣', '😉', '😍', '🥰']),
  Object.freeze(['😘', '🤗', '😎', '🤔', '😮', '😅', '😢', '😴']),
  Object.freeze(['👍', '👏', '🙏', '🙌', '👋', '🤝', '💪', '✌️']),
  Object.freeze(['❤️', '🧡', '💛', '💚', '💙', '💜', '💖', '✨']),
  Object.freeze(['🌱', '🌻', '🌈', '☀️', '🍀', '🎉', '🎁', '🎂']),
  Object.freeze(['☕', '🍰', '🏡', '🚲', '📅', '✅', '❓', '❗']),
])

/**
 * Whether the smiley stands beside a text field: at a computer only. A phone and a tablet have
 * the emoji key on their keyboard, a tap away, and a choice of the wallet's own over that keyboard
 * would leave next to nothing of the conversation. Asked by every place that has the smiley, so
 * the rule is in one place.
 *
 * @returns {boolean}
 */
export const offersEmojiPicker = () => isComputer()

/**
 * Which keys open the device's own emoji, for the line under the choice: 'mac', 'windows', or
 * null where the wallet does not know them (Linux has as many answers as desktops).
 *
 * @returns {'mac' | 'windows' | null}
 */
export const emojiKeysOf = () => {
  if (typeof navigator === 'undefined') return null
  const platform = `${navigator.userAgentData?.platform ?? ''} ${navigator.platform ?? ''} ${
    navigator.userAgent ?? ''
  }`
  if (/Mac/i.test(platform)) return 'mac'
  if (/Win/i.test(platform)) return 'windows'
  return null
}
