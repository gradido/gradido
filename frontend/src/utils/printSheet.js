// AI-GENERATED — not an architecture reference

/**
 * Printing a page whose contents have to come out at an exact physical size.
 *
 * ## Why a print sheet exists at all
 *
 * Neither printable card carries a print density in its PNG, and that is a measured
 * decision rather than an omission (see the long note in `gradidoCard.js`): Word and
 * LibreOffice honour a `pHYs` chunk, Google Docs ignores it and stretches to column width,
 * so writing one would make the same file come out at two sizes depending on where it
 * lands. The physical size is carried here instead — a page laid out in millimetres, which
 * every browser prints at exactly that size as long as nobody scales the job.
 *
 * ## Why an iframe and not a new window
 *
 * A popup is blocked by default in most browsers when it is not opened directly from the
 * click, and everything here is async by the time the picture exists. An offscreen frame
 * needs no permission, and its document is ours to lay out.
 *
 * ⚠️ Extracted from the Gradido card, which had it first. Copied instead of shared it would
 * have drifted: this dance has four details that are each one bug (decoding, the frame
 * outliving the dialogue, the fallback removal, focus before print), and a second copy
 * would keep at most three of them.
 */

/** How long a print dialogue may stay open before the frame is taken away anyway. */
const FRAME_LIFETIME_MS = 60000

/**
 * Lay out a document offscreen and hand it to the browser's print dialogue.
 *
 * @param {object} options
 * @param {string} options.style CSS for the page, including its `@page` rule
 * @param {(doc: Document) => void} options.build fills the body of the print document
 * @throws whatever `build` throws — the caller decides what to tell whom
 */
export const printSheet = async ({ style, build }) => {
  let frame = null
  try {
    frame = document.createElement('iframe')
    frame.setAttribute('aria-hidden', 'true')
    frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0'
    document.body.appendChild(frame)

    const doc = frame.contentDocument
    const sheetStyle = doc.createElement('style')
    sheetStyle.textContent = style
    doc.head.appendChild(sheetStyle)
    build(doc)

    // The picture has to be decoded before the dialogue opens, or the page goes to the
    // printer empty. decode() is the only way to know; a load event has already passed.
    // Where there is no decode(), printing still works -- a data URI needs no network --
    // so its absence must not cost the sheet. It is missing in more places than one thinks.
    await Promise.all(
      [...doc.images].map((image) =>
        typeof image.decode === 'function' ? image.decode().catch(() => {}) : null,
      ),
    )

    // The frame must outlive the dialogue -- removing it while the browser is printing
    // cancels the job. It goes when printing is over, and a minute later at the latest:
    // afterprint fires on cancel too, but not everywhere, and a frame per click adds up.
    const remove = () => frame?.remove()
    frame.contentWindow.addEventListener('afterprint', remove)
    setTimeout(remove, FRAME_LIFETIME_MS)

    frame.contentWindow.focus()
    frame.contentWindow.print()
  } catch (error) {
    frame?.remove()
    throw error
  }
}
