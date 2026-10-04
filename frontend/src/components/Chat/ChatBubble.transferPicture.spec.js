// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { describe, it, expect, afterEach, vi } from 'vitest'
import ChatBubble from './ChatBubble.vue'
import { THANK_YOU_MOTIF_KEYS } from '@/utils/thankYouMotifs'

/**
 * A transfer the sender added a picture to, in the conversation of the two (ZE-016): the bubble
 * of a transfer with the picture under its head and the memo under the picture -- the shape of a
 * greeting's booking without the line in handwriting. A transfer without a picture stays what it
 * was.
 *
 * The stand-ins are those of ChatBubble.greeting.spec.js: `t` answers with the key.
 */
vi.mock('@vue/apollo-composable', () => ({
  useApolloClient: () => ({ client: { query: () => new Promise(() => {}) } }),
}))

vi.mock('@/i18n', () => ({
  default: { global: { t: (key, values) => (values ? `${key} ${JSON.stringify(values)}` : key) } },
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key, values) => (values ? `${key} ${JSON.stringify(values)}` : key),
    d: (date, format) => `${format}(${date.toISOString()})`,
    locale: { value: 'de' },
  }),
}))

vi.mock('@/composables/useToast', () => ({
  useAppToast: () => ({ toastSuccess: () => {}, toastError: () => {} }),
}))

/** A transfer as the thread hands it to its bubble (ChatThread, transferBubble). */
const TRANSFER = {
  key: 'transfer-12',
  transfer: true,
  mine: false,
  createdAt: '2026-10-04T10:41:00.000Z',
  subject: 'Oma-Emma hat Dir 50,00 Gradido gesendet',
  body: 'Für die Bank.',
  greeting: null,
  linkId: null,
  greetingSender: 'Oma-Emma',
  picture: null,
  transactionId: 12,
}
const WITH_MOTIF = { ...TRANSFER, picture: { motif: 'giving-hands', hasPicture: false } }
const WITH_PHOTO = { ...TRANSFER, picture: { motif: null, hasPicture: true } }

describe('ChatBubble, a transfer with a picture', () => {
  let wrapper

  const stubs = {
    IMdiEmailOutline: true,
    IMdiCalendarPlusOutline: true,
    IMdiContentDuplicate: true,
    IMdiDotsHorizontal: true,
    IMdiShare: true,
    I18nT: true,
    // The photo's place: what it is asked by, and whose it is said to be.
    ThankYouGreetingPhoto: {
      name: 'ThankYouGreetingPhoto',
      props: { linkId: Number, transactionId: Number, alt: String, saysMissing: Boolean },
      template: '<span data-test="photo-stub" />',
    },
  }

  const mountBubble = (message) => {
    wrapper = mount(ChatBubble, { props: { message, alias: 'Oma-Emma' }, global: { stubs } })
    return wrapper
  }

  const row = () => wrapper.find('[data-test="chat-bubble"]')
  const motif = () => wrapper.find('[data-test="chat-bubble-transfer-motif"]')
  const photo = () => wrapper.findComponent({ name: 'ThankYouGreetingPhoto' })
  const parts = () =>
    [...wrapper.find('.chat-bubble').element.children].map((child) => child.classList[0])

  afterEach(() => {
    wrapper?.unmount()
  })

  it('keeps the order: the head, the picture, the memo, the time', () => {
    mountBubble(WITH_MOTIF)

    expect(parts()).toEqual([
      'visually-hidden',
      'chat-bubble-subject',
      'chat-bubble-greeting-picture',
      'memo-text',
      'chat-bubble-meta',
    ])
  })

  it('takes the shape of a greeting’s bubble, without a line in handwriting', () => {
    mountBubble(WITH_MOTIF)

    expect(row().classes()).toEqual(
      expect.arrayContaining(['chat-bubble-transfer', 'chat-bubble-greeting']),
    )
    expect(wrapper.find('[data-test="chat-bubble-greeting-line"]').exists()).toBe(false)
    expect(wrapper.find('.memo-text').text()).toBe('Für die Bank.')
  })

  it.each(THANK_YOU_MOTIF_KEYS)(
    'shows the motif %s, by its name, in the room of the picture',
    (key) => {
      mountBubble({ ...TRANSFER, picture: { motif: key, hasPicture: false } })

      expect(motif().attributes('src')).toBe(`/img/thank-you-greeting/${key}.svg`)
      expect(motif().attributes('alt')).toBe(`thank-you-greeting.motif.${key}`)
      expect(motif().attributes('width')).toBe('360')
      expect(motif().attributes('height')).toBe('250')
      expect(photo().exists()).toBe(false)
    },
  )

  describe('with a photo', () => {
    it('asks for it by the id of the booking -- never by the id of a link', () => {
      mountBubble({ ...WITH_PHOTO, linkId: 4711 })

      expect(photo().props('transactionId')).toBe(12)
      expect(photo().props('linkId')).toBeUndefined()
      expect(motif().exists()).toBe(false)
    })

    it('says whose photo it is: the sender’s, and "Bild nicht verfügbar" in the room where none comes', () => {
      mountBubble(WITH_PHOTO)

      expect(photo().props('alt')).toBe('thank-you-greeting.photo-of {"name":"Oma-Emma"}')
      expect(photo().props('saysMissing')).toBe(true)
    })

    it('names oneself on one’s own side', () => {
      mountBubble({ ...WITH_PHOTO, mine: true, greetingSender: 'Bernd' })

      expect(photo().props('alt')).toBe('thank-you-greeting.photo-of {"name":"Bernd"}')
    })
  })

  describe('stays the bubble of a plain transfer', () => {
    const plain = () => {
      expect(parts()).toEqual([
        'visually-hidden',
        'chat-bubble-subject',
        'memo-text',
        'chat-bubble-meta',
      ])
      expect(row().classes()).not.toContain('chat-bubble-greeting')
      expect(motif().exists()).toBe(false)
      expect(photo().exists()).toBe(false)
      expect(wrapper.find('.memo-text').text()).toBe('Für die Bank.')
    }

    it('without a picture', () => {
      mountBubble(TRANSFER)
      plain()
    })

    it('where the booking names none at all (an older server)', () => {
      const { picture: _picture, ...older } = TRANSFER
      mountBubble(older)
      plain()
    })

    it('with a motif this wallet does not know', () => {
      mountBubble({ ...TRANSFER, picture: { motif: 'elephant', hasPicture: false } })
      plain()
    })
  })

  it('shows a greeting as a greeting, whatever the booking says of a picture beside it', () => {
    mountBubble({
      ...WITH_MOTIF,
      body: 'Einfach so.\nLiebe Sarah',
      greeting: { motif: 'morning-light', line: 'Einfach so.' },
    })

    expect(wrapper.find('[data-test="chat-bubble-greeting-motif"]').attributes('src')).toBe(
      '/img/thank-you-greeting/morning-light.svg',
    )
    expect(motif().exists()).toBe(false)
  })

  it('shows no picture in a message that is no transfer', () => {
    mountBubble({
      key: 'm-1',
      id: 1,
      mine: false,
      createdAt: '2026-10-04T10:41:00.000Z',
      body: 'Hallo',
      picture: { motif: 'bouquet', hasPicture: false },
    })

    expect(motif().exists()).toBe(false)
    expect(row().classes()).not.toContain('chat-bubble-greeting')
  })
})
