// AI-GENERATED — not an architecture reference

/**
 * Hands a text to the device's own share sheet, and runs the fallback where that does not work.
 *
 * Only `text` goes along, no `url`: the callers put the link into the text, and Chrome on
 * Android joins text and url with a space (`ShareParams.getTextAndUrl`), so the message would
 * carry the link twice. Closing the sheet rejects with an `AbortError` -- the member changed
 * their mind, which is not an error and gets no message. Every other failure runs the
 * fallback, including a browser without a share sheet: there `navigator.share` is missing and
 * the call throws.
 *
 * Two callers, one rule: the transaction link (`useCopyLinks`) and the Gradido address on the
 * page for showing Gradido to somebody (`pages/ShowFriends`). Written once, because the
 * missing `url` above was learnt at the device, and a second copy would have to learn it again.
 *
 * @param {string} text what goes into the message, the link included
 * @param {() => unknown} fallback runs when there is no sheet or it refuses; usually a copy
 */
export const shareText = async (text, fallback) => {
  try {
    await navigator.share({ text })
  } catch (error) {
    if (error?.name !== 'AbortError') await fallback()
  }
}
