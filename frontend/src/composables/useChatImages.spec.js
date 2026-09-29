// AI-GENERATED — not an architecture reference
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { chatMessageImage } from '@/graphql/chat.graphql'

/**
 * The store lives at module level, as it does in the wallet -- so every test takes a fresh module,
 * and nothing one test left on its way holds up the next.
 */
let images
beforeEach(async () => {
  vi.resetModules()
  images = await import('./useChatImages')
})

/** jsdom has no object URLs: numbered ones, and a record of what was given back. */
let made
let revoked
beforeEach(() => {
  made = []
  revoked = []
  URL.createObjectURL = vi.fn((blob) => {
    made.push(blob)
    return `blob:picture-${made.length}`
  })
  URL.revokeObjectURL = vi.fn((address) => revoked.push(address))
})
afterEach(() => {
  delete URL.createObjectURL
  delete URL.revokeObjectURL
  vi.restoreAllMocks()
})

/** A client whose answers a test settles one by one, in any order. */
const clientHolding = () => {
  const asked = []
  const client = {
    query: vi.fn(
      (options) => new Promise((resolve, reject) => asked.push({ options, resolve, reject })),
    ),
  }
  const answer = (index, base64) => asked[index].resolve({ data: { chatMessageImage: base64 } })
  return { client, asked, answer }
}

const JPEG = btoa('JPEG')

describe('useChatImages', () => {
  // ⛔ No base64 in Apollo's cache: every picture would stay there as ~44,000 characters.
  it('asks for a picture by its uuid, without the cache', () => {
    const { client } = clientHolding()

    images.requestChatImage(client, 'image-1')

    expect(client.query).toHaveBeenCalledWith({
      query: chatMessageImage,
      variables: { imageUuid: 'image-1' },
      fetchPolicy: 'no-cache',
    })
  })

  it('keeps the picture as an address in memory, from its bytes', async () => {
    const { client, answer } = clientHolding()
    images.requestChatImage(client, 'image-1')
    expect(images.chatImage('image-1')).toEqual({ state: 'loading', src: null })

    answer(0, JPEG)
    await flushPromises()

    expect(images.chatImage('image-1')).toEqual({ state: 'ready', src: 'blob:picture-1' })
    // The bytes themselves, as a JPEG -- not the base64 text.
    expect(made[0].type).toBe('image/jpeg')
    expect(made[0].size).toBe(4)
    const text = await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.readAsText(made[0])
    })
    expect(text).toBe('JPEG')
  })

  it('asks once for a picture that is here or on its way, however its uuid is written', async () => {
    const { client, answer } = clientHolding()
    images.requestChatImage(client, 'image-1')
    images.requestChatImage(client, 'IMAGE-1')
    expect(client.query).toHaveBeenCalledTimes(1)

    answer(0, JPEG)
    await flushPromises()
    images.requestChatImage(client, 'image-1')

    expect(client.query).toHaveBeenCalledTimes(1)
    expect(images.chatImage('IMAGE-1').src).toBe('blob:picture-1')
  })

  // A thread that opens with many pictures in sight fetches them three by three.
  it('has at most three pictures on their way at a time, the next when one has come', async () => {
    const { client, answer } = clientHolding()
    for (const n of [1, 2, 3, 4, 5]) images.requestChatImage(client, `image-${n}`)

    expect(images.CHAT_IMAGES_AT_ONCE).toBe(3)
    expect(client.query).toHaveBeenCalledTimes(3)

    answer(1, JPEG)
    await flushPromises()
    expect(client.query).toHaveBeenCalledTimes(4)
    // First come, first served.
    expect(client.query.mock.calls[3][0].variables.imageUuid).toBe('image-4')

    answer(0, JPEG)
    answer(2, JPEG)
    await flushPromises()
    expect(client.query).toHaveBeenCalledTimes(5)
  })

  // Null is the server's "not for you, not there, not any more": said as such, and not asked again.
  it('says a picture the server gave nothing for is missing, and does not ask again', async () => {
    const { client, answer } = clientHolding()
    images.requestChatImage(client, 'image-1')

    answer(0, null)
    await flushPromises()
    images.requestChatImage(client, 'image-1')

    expect(images.chatImage('image-1')).toEqual({ state: 'missing', src: null })
    expect(client.query).toHaveBeenCalledTimes(1)
    expect(made).toEqual([])
  })

  // The line, not the picture: asked again the next time.
  it('asks again for a picture whose question failed', async () => {
    const { client, asked } = clientHolding()
    images.requestChatImage(client, 'image-1')

    asked[0].reject(new Error('Network error'))
    await flushPromises()
    expect(images.chatImage('image-1')).toEqual({ state: 'failed', src: null })

    images.requestChatImage(client, 'image-1')
    expect(client.query).toHaveBeenCalledTimes(2)
    expect(images.chatImage('image-1').state).toBe('loading')
  })

  // One's own picture, just sent: from the JPEG made here, no question to the server.
  it('keeps one’s own picture from the JPEG just sent, without asking', () => {
    const { client } = clientHolding()

    images.rememberChatImage('own-image', JPEG)
    images.requestChatImage(client, 'own-image')

    expect(images.chatImage('own-image')).toEqual({ state: 'ready', src: 'blob:picture-1' })
    expect(client.query).not.toHaveBeenCalled()
  })

  /**
   * ⛔ At logout, beside forgetAllMemberAvatars: the next member on this browser is handed nothing
   * of the one before -- the addresses given back, the store empty, the ones in line never asked
   * for, and an answer that lands afterwards dropped.
   */
  it('lets every picture go, and drops what was still on its way', async () => {
    const { client, asked, answer } = clientHolding()
    const uuids = () => asked.map((question) => question.options.variables.imageUuid)
    images.rememberChatImage('own-image', JPEG)
    for (const n of [1, 2, 3, 4, 5]) images.requestChatImage(client, `image-${n}`)
    answer(0, JPEG)
    await flushPromises()
    expect(images.chatImage('image-1').src).toBe('blob:picture-2')
    // On their way now: 2, 3 and 4; 5 is in line.
    expect(uuids()).toEqual(['image-1', 'image-2', 'image-3', 'image-4'])

    images.forgetAllChatImages()

    expect(revoked.sort()).toEqual(['blob:picture-1', 'blob:picture-2'])
    expect(images.chatImage('own-image')).toBeNull()
    expect(images.chatImage('image-1')).toBeNull()
    expect(images.chatImage('image-2')).toBeNull()

    // An answer of the one before, landing now: given back, not kept.
    answer(1, JPEG)
    await flushPromises()
    expect(images.chatImage('image-2')).toBeNull()
    expect(revoked).toContain('blob:picture-3')
    // The one in line was never asked for…
    expect(uuids()).not.toContain('image-5')

    // …and the next member's pictures do not wait for the one before's still on their way.
    for (const n of [6, 7, 8]) images.requestChatImage(client, `image-${n}`)
    expect(uuids().slice(-3)).toEqual(['image-6', 'image-7', 'image-8'])
    // Nor does an old answer free a place of theirs: still three on their way, none more.
    answer(2, JPEG)
    await flushPromises()
    expect(images.chatImage('image-3')).toBeNull()
    images.requestChatImage(client, 'image-9')
    expect(uuids()).not.toContain('image-9')
  })

  // ⛔ Memory only (E-041, point 5): nothing of a picture goes into the browser's storage.
  it('puts nothing into the browser’s storage', async () => {
    const stored = vi.spyOn(Storage.prototype, 'setItem')
    const { client, answer } = clientHolding()

    images.requestChatImage(client, 'image-1')
    answer(0, JPEG)
    images.rememberChatImage('own-image', JPEG)
    await flushPromises()

    expect(stored).not.toHaveBeenCalled()
  })

  it('asks for nothing without a uuid', () => {
    const { client } = clientHolding()
    images.requestChatImage(client, '')
    images.requestChatImage(client, undefined)
    images.rememberChatImage('', JPEG)
    expect(client.query).not.toHaveBeenCalled()
    expect(made).toEqual([])
  })
})
