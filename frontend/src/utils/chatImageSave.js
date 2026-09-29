// AI-GENERATED — not an architecture reference
import { drawChatImage } from '@/utils/chatImage'
import { CHAT_IMAGE_FULL_MAX_PIXELS, chatImageCutSize } from '@/utils/chatImageEdit'
import { isComputer } from '@/utils/isComputer'

// "Sichern" (E-047, point 5): the edited picture in full quality on the member's own device --
// before anything is made small, which happens only when the message is sent. A photo taken with
// "Foto aufnehmen" is kept nowhere else: the camera app hands it to the wallet and to no album.
//
// Drawn anew from the picture as chosen, so the file carries no EXIF either -- no GPS position.

/** "Full quality": what a camera app writes, not the 45 to 85 % a chat picture is made small with. */
export const CHAT_IMAGE_SAVE_QUALITY = 0.92

const pad = (number) => String(number).padStart(2, '0')

/**
 * The file's name: Gradido and the member's own day and time, nothing a file system minds --
 * `Gradido-2026-09-29-17-42.jpg`.
 */
export const chatImageFileName = (date = new Date()) =>
  `Gradido-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(
    date.getHours(),
  )}-${pad(date.getMinutes())}.jpg`

/**
 * The edited picture as a JPEG file: the cutout at its own size, below an iPhone's bound
 * (CHAT_IMAGE_FULL_MAX_PIXELS), drawn in one step from the picture as chosen.
 *
 * `draw` is there for the spec -- jsdom paints nothing -- and defaults to the drawing of the
 * picture that is sent (utils/chatImage), so the file shows what the message shows.
 *
 * @param {{ image: CanvasImageSource, width: number, height: number }} source
 * @param {object} edit what the member did in the editor
 */
export const chatImageFile = async (
  source,
  edit,
  { draw = drawChatImage, date = new Date() } = {},
) => {
  const { width, height } = chatImageCutSize(
    source.width,
    source.height,
    edit,
    CHAT_IMAGE_FULL_MAX_PIXELS,
  )
  const canvas = draw(source, edit, width, height)
  const blob = await new Promise((resolve, reject) =>
    canvas.toBlob(
      (made) => (made ? resolve(made) : reject(new Error('encode'))),
      'image/jpeg',
      CHAT_IMAGE_SAVE_QUALITY,
    ),
  )
  return new File([blob], chatImageFileName(date), { type: 'image/jpeg' })
}

/**
 * Hands the file to the member's device. On a phone or a tablet through its share sheet: there
 * "Bild sichern" puts it among the photos, where a download would land among the files. On a
 * computer as a download, through a link of its own with `download`, as the calendar file goes.
 *
 * Resolves how it went:
 * - `shared` -- the sheet took it;
 * - `downloaded` -- the browser saves it;
 * - `cancelled` -- the member closed the sheet: their change of mind, no error and no message;
 * - `again` -- the sheet refused to open without a tap of its own (`NotAllowedError`): making a
 *   large picture takes a moment, and Safari lets a tap open the sheet for a moment only. The
 *   caller keeps the file and offers a second tap.
 * Where there is no sheet, or it fails otherwise, the file is downloaded.
 *
 * @param {File} file from chatImageFile
 */
export const saveChatImageFile = async (file, { computer = isComputer() } = {}) => {
  if (
    !computer &&
    typeof navigator.share === 'function' &&
    navigator.canShare?.({ files: [file] })
  ) {
    try {
      await navigator.share({ files: [file] })
      return 'shared'
    } catch (error) {
      if (error?.name === 'AbortError') return 'cancelled'
      if (error?.name === 'NotAllowedError') return 'again'
    }
  }
  const address = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = address
  link.download = file.name
  link.click()
  setTimeout(() => URL.revokeObjectURL(address), 10000)
  return 'downloaded'
}
