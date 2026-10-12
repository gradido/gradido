// AI-GENERATED — not an architecture reference

/**
 * Puts `text` into a text field where its caret stands -- in the place of what is selected there
 * --, as if it had been typed: the field's own `input` event goes out, so whatever listens to the
 * field (`v-model`, a field that grows with its words, a validation) hears it, and the caret
 * stands behind what was put in.
 *
 * The field need not hold the focus: a field keeps its caret while the focus is elsewhere, and
 * that place is taken. Afterwards the focus is in the field.
 *
 * ⛔ Nothing is put in where it would not fit: a field with `maxlength` counts as it counts what
 * is typed, and an emoji is two of its units or more -- half of one would be a broken sign. The
 * browser holds the limit for what is typed, not for what a script writes, so it is asked here.
 *
 * Typed, where the browser can: `insertText` keeps the field's undo history, and Cmd/Ctrl+Z takes
 * the insertion back like a keystroke. Written into the field where it cannot (the command is
 * old, and a browser may drop it), with the event sent after it.
 *
 * @param {HTMLTextAreaElement | HTMLInputElement | null | undefined} field
 * @param {string} text
 * @returns {boolean} whether it was put in
 */
export const insertAtCaret = (field, text) => {
  if (!field || typeof field.value !== 'string' || !text) return false
  // A field that takes no words takes none from here: what a script writes gets past both.
  if (field.disabled || field.readOnly) return false
  const start = field.selectionStart ?? field.value.length
  const end = field.selectionEnd ?? start
  const limit = field.maxLength
  if (limit >= 0 && field.value.length - (end - start) + text.length > limit) return false

  field.focus({ preventScroll: true })
  // The caret as it stood: a browser may put it elsewhere when the focus comes back by script.
  field.setSelectionRange(start, end)

  const before = field.value
  let typed = false
  // The browser types where the focus IS. A field that could not take it -- hidden, or kept out by
  // a dialog that holds the focus -- is written into directly: typed, the emoji would land in
  // whatever holds the focus, and then here as well.
  if (document.activeElement === field && typeof document.execCommand === 'function') {
    try {
      typed = document.execCommand('insertText', false, text)
    } catch {
      typed = false
    }
  }
  // "Done" with nothing changed is not done -- unless what was selected is what was put in.
  if (typed && (field.value !== before || before.slice(start, end) === text)) return true

  field.setRangeText(text, start, end, 'end')
  field.dispatchEvent(
    new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }),
  )
  return true
}
