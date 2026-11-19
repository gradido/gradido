// AI-GENERATED — not an architecture reference
import m from 'mithril'
import { boldAround } from '@/data/MessageForm.logic'

/** Ctrl/Cmd+B sets the selection of a text field **bold**, shown bold in the thread. */
export const boldShortcut = (event: KeyboardEvent, set: (value: string) => void) => {
  if (!((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'b')) {
    return
  }
  event.preventDefault()
  const field = event.target as HTMLTextAreaElement
  const { value, caret } = boldAround(
    field.value,
    field.selectionStart ?? 0,
    field.selectionEnd ?? 0,
  )
  set(value)
  m.redraw.sync()
  field.setSelectionRange(caret, caret)
}
