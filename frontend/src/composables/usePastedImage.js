// AI-GENERATED — not an architecture reference
import { onBeforeUnmount, onMounted } from 'vue'
import { pastedImage } from '@/utils/pastedImage'

/**
 * Ctrl+V (Cmd+V) with a picture on the clipboard: the picture goes to `take` as a file, as if
 * the member had chosen it in the device's picker -- where `belongs` says the paste is this
 * component's (utils/pastedImage, `pasteIsFor`, and the component's own state).
 *
 * Heard on the document, for as long as the component stands: a paste goes to the element that
 * has the focus, and that is often not inside the component -- the window around it, or the page.
 *
 * ⛔ Words win (`pastedImage`): a paste that carries text is left alone, for the field it goes to.
 * A picture that is taken is the paste's only effect (`preventDefault`), and a second component
 * leaves a paste alone that one has taken.
 *
 * @param {(file: File) => unknown} take
 * @param {(event: ClipboardEvent) => boolean} belongs
 */
export const usePastedImage = (take, belongs) => {
  const onPaste = (event) => {
    if (event.defaultPrevented || !belongs(event)) return
    const file = pastedImage(event)
    if (!file) return
    event.preventDefault()
    take(file)
  }
  onMounted(() => document.addEventListener('paste', onPaste))
  onBeforeUnmount(() => document.removeEventListener('paste', onPaste))
}
