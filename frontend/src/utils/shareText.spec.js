// AI-GENERATED — not an architecture reference

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { shareText } from './shareText'

const share = vi.fn()
const fallback = vi.fn()

describe('shareText', () => {
  beforeEach(() => {
    share.mockReset().mockResolvedValue(undefined)
    fallback.mockReset()
    Object.defineProperty(window.navigator, 'share', { value: share, configurable: true })
  })

  afterEach(() => {
    delete window.navigator.share
  })

  /**
   * ⛔ The text alone. Chrome on Android joins text and url with a space, so a `url` beside a
   * text that already carries the link would put the link into the message twice.
   */
  it('hands the text to the share sheet, and nothing else', async () => {
    await shareText('Look: https://example.test/u/alice', fallback)

    expect(share).toHaveBeenCalledTimes(1)
    expect(share.mock.calls[0][0]).toEqual({ text: 'Look: https://example.test/u/alice' })
    expect(fallback).not.toHaveBeenCalled()
  })

  it('runs the fallback where the device has no share sheet', async () => {
    delete window.navigator.share

    await shareText('Look', fallback)

    expect(fallback).toHaveBeenCalledTimes(1)
  })

  // Closing the sheet is a change of mind, not a failure: no copy, no message.
  it('does nothing when the member closes the sheet', async () => {
    share.mockRejectedValue(new DOMException('Share canceled', 'AbortError'))

    await shareText('Look', fallback)

    expect(fallback).not.toHaveBeenCalled()
  })

  it('runs the fallback when the sheet refuses for any other reason', async () => {
    share.mockRejectedValue(new DOMException('Not allowed', 'NotAllowedError'))

    await shareText('Look', fallback)

    expect(fallback).toHaveBeenCalledTimes(1)
  })
})
