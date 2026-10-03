// AI-GENERATED — not an architecture reference
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import {
  forgetAllGreetingPictures,
  rememberGreetingPicture,
} from '@/composables/useGreetingPictures'
import ThankYouGreetingPhoto from './ThankYouGreetingPhoto.vue'

const apollo = vi.hoisted(() => ({ client: { query: null } }))
vi.mock('@vue/apollo-composable', () => ({ useApolloClient: () => ({ client: apollo.client }) }))

/** A promise a test settles when it wants. */
const deferred = () => {
  const settle = {}
  const promise = new Promise((resolve, reject) => Object.assign(settle, { resolve, reject }))
  return { promise, ...settle }
}

describe('ThankYouGreetingPhoto', () => {
  let wrapper
  /** The observers the component made, each with what it watches and its callback. */
  let observers

  const mountPhoto = (props = {}) => {
    wrapper = mount(ThankYouGreetingPhoto, {
      props: { linkId: 4711, alt: 'Foto von Oma-Emma', ...props },
      attrs: { class: 'place-of-the-parent' },
      global: { plugins: [i18n] },
      attachTo: document.body,
    })
    return wrapper
  }
  const photo = () => wrapper.find('[data-test="thank-you-greeting-photo"]')
  const room = () => wrapper.find('[data-test="thank-you-greeting-photo-room"]')
  /** The place comes into sight, or something else does. */
  const sight = async (isIntersecting = true) => {
    observers.at(-1).callback([{ isIntersecting }])
    await flushPromises()
  }

  beforeEach(() => {
    i18n.global.locale.value = 'de'
    observers = []
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(callback) {
          this.callback = callback
          this.watched = []
          this.disconnect = vi.fn()
          observers.push(this)
        }

        observe(element) {
          this.watched.push(element)
        }
      },
    )
    apollo.client.query = vi
      .fn()
      .mockResolvedValue({ data: { thankYouGreetingPicture: 'U01BTEw=' } })
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    forgetAllGreetingPictures()
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
  })

  /** The room is there before the photo has come: nothing moves when it does. */
  it('stands as an empty room before the photo has come, in the place its parent gives it', () => {
    mountPhoto()

    expect(photo().exists()).toBe(false)
    expect(room().exists()).toBe(true)
    expect(room().classes()).toEqual(
      expect.arrayContaining(['place-of-the-parent', 'thank-you-greeting-photo', 'is-waiting']),
    )
    expect(room().text()).toBe('')
  })

  // A long conversation opened at its end does not fetch the photos of its beginning.
  it('asks for nothing until its place is in sight', async () => {
    mountPhoto()
    await flushPromises()

    expect(observers).toHaveLength(1)
    expect(observers[0].watched).toEqual([room().element])
    expect(apollo.client.query).not.toHaveBeenCalled()

    await sight(false)
    expect(apollo.client.query).not.toHaveBeenCalled()
  })

  it('asks for the photo of its link once the place is in sight, and stops watching', async () => {
    mountPhoto()

    await sight()

    expect(apollo.client.query).toHaveBeenCalledTimes(1)
    expect(apollo.client.query.mock.calls[0][0].variables).toEqual({ linkId: 4711 })
    expect(observers[0].disconnect).toHaveBeenCalledTimes(1)
  })

  it('shows the photo once it has come, with whose it is, in the same place', async () => {
    mountPhoto()

    await sight()

    expect(room().exists()).toBe(false)
    expect(photo().attributes('src')).toBe('data:image/jpeg;base64,U01BTEw=')
    expect(photo().attributes('alt')).toBe('Foto von Oma-Emma')
    expect(photo().classes()).toEqual(
      expect.arrayContaining(['place-of-the-parent', 'thank-you-greeting-photo']),
    )
    // the room of a motif: 36 : 25 before a pixel has come
    expect(photo().attributes('width')).toBe('360')
    expect(photo().attributes('height')).toBe('250')
  })

  it('keeps its room while the photo is on its way', async () => {
    const answer = deferred()
    apollo.client.query.mockReturnValueOnce(answer.promise)
    mountPhoto()

    await sight()
    expect(room().exists()).toBe(true)
    expect(room().classes()).not.toContain('is-missing')

    answer.resolve({ data: { thankYouGreetingPicture: 'U01BTEw=' } })
    await flushPromises()
    expect(photo().exists()).toBe(true)
  })

  // One's own, kept from what the wallet sent -- or fetched by another place before.
  it('shows a photo that is here already at once, watches nothing and asks nobody', async () => {
    rememberGreetingPicture(4711, 'T1dO')

    mountPhoto()
    await flushPromises()

    expect(photo().attributes('src')).toBe('data:image/jpeg;base64,T1dO')
    expect(observers).toHaveLength(0)
    expect(apollo.client.query).not.toHaveBeenCalled()
  })

  describe('where the server gives nothing for it', () => {
    beforeEach(() => {
      apollo.client.query.mockResolvedValue({ data: { thankYouGreetingPicture: null } })
    })

    it('keeps the room, and says the chat’s sentence in it where the room is large enough', async () => {
      mountPhoto({ saysMissing: true })

      await sight()

      expect(photo().exists()).toBe(false)
      expect(room().classes()).toContain('is-missing')
      expect(room().text()).toBe('Bild nicht verfügbar')
    })

    // A list's room is 46 pixels wide: the list says it beside the room.
    it('keeps the room empty where it is too small for a sentence', async () => {
      mountPhoto()

      await sight()

      expect(room().classes()).toContain('is-missing')
      expect(room().text()).toBe('')
    })
  })

  // The line, not the picture: the room stays as it is, in the colour of the card.
  it('keeps the room, without a word, where the line failed', async () => {
    apollo.client.query.mockRejectedValue(new Error('Network error'))
    mountPhoto({ saysMissing: true })

    await sight()

    expect(room().exists()).toBe(true)
    expect(room().classes()).not.toContain('is-missing')
    expect(room().text()).toBe('')
  })

  it('asks at once where the browser has no IntersectionObserver', async () => {
    vi.stubGlobal('IntersectionObserver', undefined)

    mountPhoto()
    await flushPromises()

    expect(apollo.client.query).toHaveBeenCalledTimes(1)
    expect(photo().exists()).toBe(true)
  })

  // A booking of an older server, or a list entry without an id: nothing to ask for.
  it('asks nothing without the id of a link, and keeps its room', async () => {
    mountPhoto({ linkId: null })

    await sight()

    expect(apollo.client.query).not.toHaveBeenCalled()
    expect(room().exists()).toBe(true)
  })

  /**
   * What only the stylesheet holds (jsdom lays nothing out): the waiting room is a box. An empty
   * inline element is a point at its top left corner -- the photo of a bubble whose top had
   * scrolled out of the thread was not asked for, though most of its room was in sight.
   */
  it('is a box of its own while it waits, so that any part of its place in sight counts', () => {
    const code = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), 'ThankYouGreetingPhoto.vue'),
      'utf8',
    ).replace(/\/\*[\s\S]*?\*\//g, '')
    const rule = (selector) => code.match(new RegExp(`\\n${selector}\\s*\\{([^}]*)\\}`))?.[1] ?? ''

    expect(rule('\\.thank-you-greeting-photo\\.is-waiting')).toMatch(/display:\s*block/)
    // …and the sentence of a photo that is gone stands in the middle of that box
    expect(rule('\\.thank-you-greeting-photo\\.is-waiting\\.is-missing')).toMatch(/display:\s*flex/)
    expect(rule('\\.thank-you-greeting-photo')).toMatch(/object-fit:\s*cover/)
  })

  it('stops watching when it leaves the page', () => {
    mountPhoto()
    const [observer] = observers

    wrapper.unmount()
    wrapper = null

    expect(observer.disconnect).toHaveBeenCalledTimes(1)
  })
})
