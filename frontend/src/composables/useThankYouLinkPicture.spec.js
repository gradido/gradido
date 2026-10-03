// AI-GENERATED — not an architecture reference
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import CONFIG from '@/config'
import { useThankYouLinkPicture } from './useThankYouLinkPicture'

const CODE = 'a3f9c2d41b7e19981fa0c4e2'
const ADDRESS = `https://ki-playground.gradido.net/api/thank-you-greeting-picture/${CODE}`

/** A promise a test settles when it wants. */
const deferred = () => {
  const settle = {}
  const promise = new Promise((resolve, reject) => Object.assign(settle, { resolve, reject }))
  return { promise, ...settle }
}

const jpeg = () => new Blob(['JPEG'], { type: 'image/jpeg' })
const answer = (blob, ok = true) => ({
  ok,
  status: ok ? 200 : 404,
  blob: () => Promise.resolve(blob),
})

describe('useThankYouLinkPicture', () => {
  const graphqlUri = CONFIG.GRAPHQL_URI
  let wrapper
  let held
  let made
  let revoked

  /** The composable in a page, as pages/TransactionLink.vue holds it. */
  const mountPage = () => {
    wrapper = mount({
      setup() {
        held = useThankYouLinkPicture()
        return () => null
      },
    })
    return held
  }

  beforeEach(() => {
    CONFIG.GRAPHQL_URI = 'https://ki-playground.gradido.net/graphql'
    made = vi.fn(() => `blob:picture-${made.mock.calls.length}`)
    revoked = vi.fn()
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: made, revokeObjectURL: revoked }))
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(answer(jpeg())))
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    CONFIG.GRAPHQL_URI = graphqlUri
    vi.unstubAllGlobals()
  })

  it('has no picture before it is asked for one, and asks nobody', () => {
    const { picture } = mountPage()

    expect(picture.value).toBeNull()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('fetches the picture from the address of the link, without cookies and past every cache', async () => {
    const { picture, load } = mountPage()

    await load(CODE)

    expect(fetch).toHaveBeenCalledTimes(1)
    expect(fetch).toHaveBeenCalledWith(ADDRESS, { cache: 'no-store', credentials: 'omit' })
    expect(picture.value).toBe('blob:picture-1')
  })

  /**
   * ⛔ Once. After the thank-you is accepted the address serves the picture no more: whatever
   * asked again then would lose the picture the page had a moment before.
   */
  it('asks once, however often the page asks for it', async () => {
    const { picture, load } = mountPage()

    await load(CODE)
    fetch.mockResolvedValue(answer(new Blob([]), false))
    await load(CODE)
    await load(CODE)

    expect(fetch).toHaveBeenCalledTimes(1)
    expect(picture.value).toBe('blob:picture-1')
  })

  it('asks once where the second call comes before the first answer', async () => {
    const pending = deferred()
    fetch.mockReturnValueOnce(pending.promise)
    const { picture, load } = mountPage()

    const first = load(CODE)
    const second = load(CODE)
    pending.resolve(answer(jpeg()))
    await Promise.all([first, second])

    expect(fetch).toHaveBeenCalledTimes(1)
    expect(picture.value).toBe('blob:picture-1')
  })

  // Unknown code, link without a photo, link not open: the same empty answer.
  it('stays without a picture where the server serves none', async () => {
    fetch.mockResolvedValue(answer(new Blob([]), false))
    const { picture, load } = mountPage()

    await load(CODE)

    expect(picture.value).toBeNull()
    expect(made).not.toHaveBeenCalled()
  })

  // What decides is the answer's status: an empty answer is none, whatever type it claims to be.
  it('takes no picture from an answer that is not ok, even one that calls itself a JPEG', async () => {
    fetch.mockResolvedValue(answer(jpeg(), false))
    const { picture, load } = mountPage()

    await load(CODE)

    expect(picture.value).toBeNull()
    expect(made).not.toHaveBeenCalled()
  })

  it('stays without a picture where the line fails, and does not throw', async () => {
    fetch.mockRejectedValue(new TypeError('Failed to fetch'))
    const { picture, load } = mountPage()

    await expect(load(CODE)).resolves.toBeUndefined()

    expect(picture.value).toBeNull()
  })

  // The server serves one type and nothing else: a page of some proxy is no picture.
  it.each(['text/html', 'image/svg+xml', 'application/json', ''])(
    'takes nothing that is not a JPEG: %s',
    async (type) => {
      fetch.mockResolvedValue(answer(new Blob(['<html>'], { type })))
      const { picture, load } = mountPage()

      await load(CODE)

      expect(picture.value).toBeNull()
      expect(made).not.toHaveBeenCalled()
    },
  )

  it('asks nothing for what is no code of a link', async () => {
    const { picture, load } = mountPage()

    await load('CL-a3f9c2d41b7e19981fa0c4e2')
    await load(undefined)
    await load('../../graphql')

    expect(fetch).not.toHaveBeenCalled()
    expect(picture.value).toBeNull()
  })

  // …and a code that came after such a one is still asked for.
  it('still asks for a code after something that was none', async () => {
    const { picture, load } = mountPage()

    await load(undefined)
    await load(CODE)

    expect(fetch).toHaveBeenCalledTimes(1)
    expect(picture.value).toBe('blob:picture-1')
  })

  it('gives the address back to the browser when the page is left', async () => {
    const { picture, load } = mountPage()
    await load(CODE)

    wrapper.unmount()
    wrapper = null

    expect(revoked).toHaveBeenCalledWith('blob:picture-1')
    expect(picture.value).toBeNull()
  })

  // An answer that lands after the page is gone is not made into an address nobody gives back.
  it('makes no address of an answer that comes after the page is left', async () => {
    const pending = deferred()
    fetch.mockReturnValueOnce(pending.promise)
    const { picture, load } = mountPage()
    const loading = load(CODE)

    wrapper.unmount()
    wrapper = null
    pending.resolve(answer(jpeg()))
    await loading
    await flushPromises()

    expect(made).not.toHaveBeenCalled()
    expect(picture.value).toBeNull()
  })
})
