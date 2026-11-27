// AI-GENERATED — not an architecture reference
import { writeText } from 'clipboard-polyfill'
import { toastError, toastSuccess } from '@/components/ui/Toasts'
import { t } from '@/i18n'

/**
 * Copies `text` and says `copied` once it is copied; where it could not be, says so and
 * returns false, for a page that then shows the text to be copied by hand. Through the
 * polyfill: a page not served over TLS, and some browsers built into other apps, have no
 * `navigator.clipboard`.
 */
export async function copyText(
  text: string,
  copied: string,
  notCopied = t('gdd_per_link.not-copied'),
) {
  try {
    await writeText(text)
    toastSuccess(copied)
    return true
  } catch {
    toastError(notCopied)
    return false
  }
}

/** Whether this browser takes a picture into its clipboard. */
export function takesPicture() {
  return typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write !== undefined
}

/** Copies a picture, or what will be one: a promise keeps the click that allows the copy. */
export function copyPicture(png: Blob | Promise<Blob>) {
  return navigator.clipboard.write([new ClipboardItem({ 'image/png': png })])
}
