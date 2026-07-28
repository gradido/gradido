import { nextTick } from 'vue'

// Cmd/Ctrl+B wraps the current textarea selection in **...**, giving moderators
// the familiar bold shortcut. The text stays plain (just the ** markers) and is
// rendered bold on display (ParseMessage). getValue/setValue bind it to the
// field's v-model; the keydown event target is the native <textarea> (also the
// one BFormTextarea renders), which carries the selection range.
export function useBoldShortcut(getValue, setValue) {
  const onKeydown = async (event) => {
    const isBoldShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'b'
    if (!isBoldShortcut) {
      return
    }
    event.preventDefault()
    const el = event.target
    const start = el.selectionStart ?? 0
    const end = el.selectionEnd ?? 0
    const value = getValue() ?? ''
    const selected = value.slice(start, end)
    setValue(`${value.slice(0, start)}**${selected}**${value.slice(end)}`)
    // Restore a sensible caret once Vue has written the value back to the DOM:
    // after the closing ** for a selection, or between the markers when empty.
    await nextTick()
    const caret = selected ? end + 4 : start + 2
    el.setSelectionRange(caret, caret)
  }
  return { onKeydown }
}
