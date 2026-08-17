// AI-GENERATED — not an architecture reference

/**
 * A six-digit PIN is not a password, and telling the browser otherwise costs more than it
 * gives.
 *
 * ## What `type="password"` actually did here
 *
 * Chrome treats every password input as a credential field, whatever `autocomplete` says —
 * `one-time-code` was already on both fields and changed nothing. Three consequences, all
 * seen at a real till:
 *
 *   1. **It filled the saved site password in**, cut to six characters by `maxlength`. The
 *      person at the counter looks at six dots that are the beginning of their own password.
 *   2. **It offered to save the PIN** as the password for this site, over and over.
 *   3. ⛔ **And if anybody ever accepts that**, six digits replace their Gradido password in
 *      the browser's store — the damage lands on the LOGIN, not on the card.
 *
 * ## Why the masking moves into CSS
 *
 * `-webkit-text-security` hides the characters without the field being a password field, so
 * none of the three happens. It looks the same and behaves the same for the person typing.
 *
 * ⚠️ It is not universal — Chrome, Safari and Edge have had it for years, Firefox since 124.
 * Where it is missing, a text field would show the PIN in the open, at a counter, which is
 * the one thing that must not happen. So the type is chosen from the ANSWER of a feature
 * test, not from a browser list: no masking, no text field.
 */

/** The class that hides the characters. Defined once, in `gradido-template.scss`. */
export const PIN_MASK_CLASS = 'pin-masked'

/**
 * Can this browser hide the characters of a plain text field?
 *
 * ⚠️ Asked, not assumed, and asked defensively: `CSS.supports` is missing in some embedded
 * webviews, and an exception here would take the whole payment screen with it.
 */
export const canMaskWithCss = () => {
  try {
    return typeof CSS !== 'undefined' && CSS.supports('-webkit-text-security', 'disc')
  } catch {
    return false
  }
}

/**
 * Which `type` a PIN field must carry.
 *
 * @param {boolean} revealed the person asked to see the digits
 * @returns {'text'|'password'} `password` only where CSS cannot hide anything
 */
export const pinInputType = (revealed = false) => {
  if (revealed) {
    return 'text'
  }
  return canMaskWithCss() ? 'text' : 'password'
}
