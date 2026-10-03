// AI-GENERATED — not an architecture reference
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { mount } from '@vue/test-utils'
import { describe, it, expect, afterEach, vi } from 'vitest'
import { ref } from 'vue'
import ChatBubble from './ChatBubble.vue'
import { CHAT_SEARCH } from '@/utils/chatSearch'
import { THANK_YOU_MOTIF_KEYS } from '@/utils/thankYouMotifs'

/**
 * The booking of an accepted thank-you greeting, in the conversation of the two (ZE-019, Bernd,
 * 02.10.2026): a transfer's bubble with the greeting's motif, its first line in handwriting and
 * the words under it. The head stays on top; a transfer without a greeting stays what it was.
 *
 * The stand-ins are those of ChatBubble.spec.js: `t` answers with the key, so a name is the key
 * it was asked by.
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

const LINE = 'Einfach so — weil es Dich gibt.'
const WORDS = 'Liebe Sarah, lieber Claude, mit Eurem iPad hat alles angefangen.\nEure Oma'

/** A transfer as the thread hands it to its bubble (ChatThread, transferBubble). */
const TRANSFER = {
  key: 'transfer-12',
  transfer: true,
  mine: false,
  createdAt: '2026-10-02T17:42:00.000Z',
  subject: 'Oma-Emma hat Dir 20,00 Gradido gesendet',
  body: 'Danke fürs Reparieren der Gartenbank.',
}

/** The same booking made from a greeting: its memo begins with the greeting's line. */
const GREETING = {
  ...TRANSFER,
  body: `${LINE}\n${WORDS}`,
  greeting: { motif: 'morning-light', line: LINE },
}

describe('ChatBubble, the booking of a thank-you greeting', () => {
  let wrapper

  // The signs and the sentence a bubble can hold besides: none of them stands in a transfer.
  const stubs = {
    IMdiEmailOutline: true,
    IMdiCalendarPlusOutline: true,
    IMdiContentDuplicate: true,
    IMdiDotsHorizontal: true,
    IMdiShare: true,
    I18nT: true,
  }

  const mountBubble = (message, { needle } = {}) => {
    wrapper = mount(ChatBubble, {
      props: { message, alias: 'Oma-Emma' },
      global: needle === undefined ? { stubs } : { stubs, provide: { [CHAT_SEARCH]: ref(needle) } },
    })
    return wrapper
  }

  const row = () => wrapper.find('[data-test="chat-bubble"]')
  const picture = () => wrapper.find('[data-test="chat-bubble-greeting-motif"]')
  const line = () => wrapper.find('[data-test="chat-bubble-greeting-line"]')
  const words = () => wrapper.find('.chat-bubble-text')
  /** What stands in the bubble, top to bottom, each by its first class. */
  const parts = () =>
    [...wrapper.find('.chat-bubble').element.children].map((child) => child.classList[0])

  afterEach(() => {
    wrapper?.unmount()
  })

  it('keeps the order: the head, the picture, the line, the words, the time', () => {
    mountBubble(GREETING)

    expect(parts()).toEqual([
      // The writer's name, for the ear.
      'visually-hidden',
      'chat-bubble-subject',
      'chat-bubble-greeting-picture',
      'chat-bubble-greeting-line',
      'memo-text',
      'chat-bubble-meta',
    ])
    expect(row().classes()).toEqual(
      expect.arrayContaining([
        'chat-bubble-transfer',
        'chat-bubble-greeting',
        'chat-bubble-theirs',
      ]),
    )
  })

  it('keeps the head a transfer has: the coin and the mail’s words', () => {
    mountBubble(GREETING)
    const head = wrapper.find('[data-test="chat-bubble-subject"]')

    expect(head.classes()).toContain('chat-bubble-transfer-head')
    expect(head.find('svg.chat-transfer-coin').exists()).toBe(true)
    expect(head.text()).toBe('Oma-Emma hat Dir 20,00 Gradido gesendet')
    expect(wrapper.find('[data-test="chat-bubble-time"]').text()).toBe(
      'time(2026-10-02T17:42:00.000Z)',
    )
  })

  describe('the motif', () => {
    it('is an image under the name of the motif, in the room its size gives it', () => {
      mountBubble(GREETING)

      expect(picture().element.tagName).toBe('IMG')
      expect(picture().attributes('src')).toBe('/img/thank-you-greeting/morning-light.svg')
      expect(picture().attributes('alt')).toBe('thank-you-greeting.motif.morning-light')
      expect(picture().attributes('width')).toBe('360')
      expect(picture().attributes('height')).toBe('250')
    })

    it.each(THANK_YOU_MOTIF_KEYS)('is each of the five, under its own name: %s', (motif) => {
      mountBubble({ ...GREETING, greeting: { motif, line: LINE } })

      expect(picture().attributes('src')).toBe(`/img/thank-you-greeting/${motif}.svg`)
      expect(picture().attributes('alt')).toBe(`thank-you-greeting.motif.${motif}`)
    })

    // It opens nothing: no button and no link around it, unlike the picture of a message.
    it('is no control', () => {
      mountBubble(GREETING)

      expect(picture().element.closest('button, a, [role="button"]')).toBeNull()
      expect(wrapper.find('[data-test="chat-bubble-image"]').exists()).toBe(false)
    })

    it.each([
      ['no motif', { motif: null, line: LINE }],
      ['a motif this wallet does not know', { motif: 'northern-lights', line: LINE }],
    ])('is left out for %s, and the line and the words stand as they do', (_what, greeting) => {
      mountBubble({ ...GREETING, greeting })

      expect(picture().exists()).toBe(false)
      expect(wrapper.find('.chat-bubble-greeting-picture').exists()).toBe(false)
      expect(parts()).toEqual([
        'visually-hidden',
        'chat-bubble-subject',
        'chat-bubble-greeting-line',
        'memo-text',
        'chat-bubble-meta',
      ])
      expect(line().text()).toBe(LINE)
      expect(words().text()).toBe(WORDS)
      expect(row().classes()).toContain('chat-bubble-greeting')
    })
  })

  /**
   * A photo of the sender's own in the place of a motif (ZE-019): its small rendition, which the
   * two members of the booking may have. The bubble hands the photo's component the link it is
   * asked for by, and whose it is; fetching and showing are that component's own
   * (ThankYouGreetingPhoto.spec.js).
   */
  describe('a photo of the sender’s own', () => {
    const PHOTO = {
      ...GREETING,
      greeting: { motif: null, line: LINE, hasPicture: true },
      linkId: 4711,
      greetingSender: 'Oma-Emma',
    }
    const photo = () => wrapper.findComponent({ name: 'ThankYouGreetingPhoto' })
    const room = () => wrapper.find('[data-test="chat-bubble-greeting-photo"]')

    it('stands in the room of the motif, between the head and the line', () => {
      mountBubble(PHOTO)

      expect(parts()).toEqual([
        'visually-hidden',
        'chat-bubble-subject',
        'chat-bubble-greeting-picture',
        'chat-bubble-greeting-line',
        'memo-text',
        'chat-bubble-meta',
      ])
      expect(room().classes()).toContain('chat-bubble-greeting-picture')
      expect(photo().exists()).toBe(true)
      // in the room, and nothing else in it
      expect(room().findComponent({ name: 'ThankYouGreetingPhoto' }).exists()).toBe(true)
      expect(room().element.children).toHaveLength(1)
      expect(room().element.firstElementChild.classList).toContain('chat-bubble-greeting-photo')
      expect(picture().exists()).toBe(false)
      expect(row().classes()).toContain('chat-bubble-greeting')
    })

    it('is asked for by the id of the link the booking was made from', () => {
      mountBubble(PHOTO)

      expect(photo().props('linkId')).toBe(4711)
    })

    it('names whose photo it is: the sender of the booking', () => {
      mountBubble(PHOTO)
      expect(photo().props('alt')).toBe('thank-you-greeting.photo-of {"name":"Oma-Emma"}')

      // on one's own side the sender is oneself
      mountBubble({ ...PHOTO, mine: true, greetingSender: 'Bernd' })
      expect(photo().props('alt')).toBe('thank-you-greeting.photo-of {"name":"Bernd"}')
    })

    // The room is as wide as the bubble: "Bild nicht verfügbar" stands in it.
    it('lets the room say that the picture is not available', () => {
      mountBubble(PHOTO)

      expect(photo().props('saysMissing')).toBe(true)
    })

    // A booking the list hands over without the id of its link: the room stands, nothing is asked.
    it('keeps its room where the booking names no link', () => {
      mountBubble({ ...PHOTO, linkId: undefined })

      expect(photo().props('linkId')).toBeNull()
      expect(room().exists()).toBe(true)
    })

    // It opens nothing, as the motif opens nothing.
    it('is no control', () => {
      mountBubble(PHOTO)

      expect(room().element.closest('button, a, [role="button"]')).toBeNull()
      expect(room().find('button, a, [role="button"]').exists()).toBe(false)
      expect(wrapper.find('[data-test="chat-bubble-image"]').exists()).toBe(false)
    })

    it('keeps the line and the words as they stand under a motif', () => {
      mountBubble(PHOTO)

      expect(line().text()).toBe(LINE)
      expect(words().text()).toBe(WORDS)
    })

    it('gives way to the motif for a greeting that carries no photo', () => {
      mountBubble({ ...PHOTO, greeting: { motif: 'morning-light', line: LINE, hasPicture: false } })

      expect(photo().exists()).toBe(false)
      expect(picture().attributes('src')).toBe('/img/thank-you-greeting/morning-light.svg')
    })

    it('fills its room: as large as the room in the stylesheet', () => {
      const css = readFileSync(
        join(dirname(fileURLToPath(import.meta.url)), 'ChatBubble.vue'),
        'utf8',
      ).replace(/\/\*[\s\S]*?\*\//g, '')

      expect(css).toMatch(/\.chat-bubble-greeting-photo\s*\{[^}]*width:\s*100%;[^}]*height:\s*100%/)
    })
  })

  describe('the line', () => {
    it('stands in handwriting', () => {
      mountBubble(GREETING)

      expect(line().text()).toBe(LINE)
      expect(line().classes()).toContain('is-by-hand')
    })

    // The typeface has no Greek: one letter of it, and the whole line is set in the bubble's font.
    it('stands in the bubble’s font, all of it, where it has a letter the handwriting lacks', () => {
      const greek = 'Σε ευχαριστώ για τη βοήθειά σου!'
      mountBubble({
        ...GREETING,
        body: `${greek}\n${WORDS}`,
        greeting: { motif: 'bouquet', line: greek },
      })

      expect(line().text()).toBe(greek)
      expect(line().classes()).not.toContain('is-by-hand')
      expect(words().text()).toBe(WORDS)
    })

    it('stays in handwriting for a Russian line', () => {
      const russian = 'Спасибо за помощь!'
      mountBubble({ ...GREETING, body: russian, greeting: { motif: 'bouquet', line: russian } })

      expect(line().classes()).toContain('is-by-hand')
    })

    it('is left out where the greeting has none: the motif, and the memo whole', () => {
      mountBubble({ ...GREETING, greeting: { motif: 'bouquet', line: null } })

      expect(line().exists()).toBe(false)
      expect(picture().exists()).toBe(true)
      expect(words().text()).toBe(`${LINE}\n${WORDS}`)
    })
  })

  describe('the words', () => {
    it('are the memo without the line', () => {
      mountBubble(GREETING)

      expect(words().text()).toBe(WORDS)
      // The line stands once in the bubble.
      expect(wrapper.find('.chat-bubble').text().split(LINE)).toHaveLength(2)
    })

    // As the booking list shows a memo (MemoText): an address is a link, stars stay stars.
    it('are drawn as a booking’s memo is', () => {
      mountBubble({
        ...GREETING,
        body: `${LINE}\nDas **Rezept**: https://x.org/rezept`,
      })

      expect(words().classes()).toContain('memo-text')
      expect(words().text()).toBe('Das **Rezept**: https://x.org/rezept')
      expect(words().find('a').attributes('href')).toBe('https://x.org/rezept')
      expect(words().find('strong').exists()).toBe(false)
      expect(wrapper.find('.chat-message-text').exists()).toBe(false)
    })

    it('leave no empty block where the greeting is its line alone', () => {
      mountBubble({ ...GREETING, body: LINE })

      expect(line().text()).toBe(LINE)
      expect(words().exists()).toBe(false)
      expect(parts()).toEqual([
        'visually-hidden',
        'chat-bubble-subject',
        'chat-bubble-greeting-picture',
        'chat-bubble-greeting-line',
        'chat-bubble-meta',
      ])
    })

    // No wallet writes such a booking and the server takes none; a bubble shows it all the same.
    it.each([
      ['says something else first', `Vorweg. ${LINE}\n${WORDS}`],
      ['is joined to the line by a space', `${LINE} ${WORDS}`],
      ['has an empty line after the line', `${LINE}\n\n${WORDS}`],
    ])('are the whole memo, with no line above, where the memo %s', (_how, body) => {
      mountBubble({ ...GREETING, body })

      expect(line().exists()).toBe(false)
      expect(words().element.textContent).toBe(body)
      // Nothing twice, nothing lost.
      expect(wrapper.find('.chat-bubble').element.textContent.split(LINE)).toHaveLength(2)
      expect(picture().exists()).toBe(true)
    })
  })

  // What a greeting says is what somebody else wrote.
  it('shows the line and the words as text, never as markup', () => {
    const markup = '<img src=x onerror="alert(1)">'
    mountBubble({
      ...GREETING,
      body: `${markup}\n<b>fett</b> <script>alert(2)</script>`,
      greeting: { motif: 'morning-light', line: markup },
    })

    expect(line().text()).toBe(markup)
    expect(words().text()).toBe('<b>fett</b> <script>alert(2)</script>')
    // The one image is the motif; nothing of the texts became an element.
    expect(wrapper.findAll('img')).toHaveLength(1)
    expect(wrapper.find('b').exists()).toBe(false)
    expect(wrapper.find('script').exists()).toBe(false)
    expect(wrapper.find('[onerror]').exists()).toBe(false)
  })

  describe('on either side', () => {
    it('stands on the recipient’s side as the sender’s bubble', () => {
      mountBubble(GREETING)

      expect(row().classes()).toContain('chat-bubble-theirs')
      expect(wrapper.find('[data-test="chat-bubble-writer"]').text()).toBe('Oma-Emma:')
    })

    it('stands on one’s own side for the one who sent it, with all it has', () => {
      mountBubble({ ...GREETING, mine: true, subject: 'Du hast Sarah-B 20,00 Gradido gesendet' })

      expect(row().classes()).toEqual(
        expect.arrayContaining(['chat-bubble-mine', 'chat-bubble-greeting']),
      )
      expect(wrapper.find('[data-test="chat-bubble-writer"]').text()).toBe('chatThread.you:')
      expect(picture().exists()).toBe(true)
      expect(line().text()).toBe(LINE)
      expect(words().text()).toBe(WORDS)
    })
  })

  // A transfer has no menu -- nothing to forward, to change, to copy --, and a greeting is one.
  it('has no menu, as no transfer has', () => {
    mountBubble(GREETING)
    expect(wrapper.find('[data-test="chat-bubble-more"]').exists()).toBe(false)
    wrapper.unmount()
    mountBubble(TRANSFER)
    expect(wrapper.find('[data-test="chat-bubble-more"]').exists()).toBe(false)
  })

  /**
   * The search in the thread (E-057) reads a transfer's memo, which is the line and the words:
   * a hit in either is marked where it stands.
   */
  describe('the hits of the search in the thread', () => {
    const marksIn = (element) => element.findAll('mark.chat-search-mark').map((mark) => mark.text())

    it('marks a hit in the line, and keeps the line as it is', () => {
      mountBubble(GREETING, { needle: 'dich' })

      expect(marksIn(line())).toEqual(['Dich'])
      expect(line().text()).toBe(LINE)
      expect(marksIn(words())).toEqual([])
    })

    it('marks a hit in the words', () => {
      mountBubble(GREETING, { needle: 'ipad' })

      expect(marksIn(words())).toEqual(['iPad'])
      expect(marksIn(line())).toEqual([])
    })

    it('marks every place where the needle stands in both', () => {
      mountBubble({ ...GREETING, body: `${LINE}\nWeil es so ist.` }, { needle: 'weil' })

      expect(marksIn(line())).toEqual(['weil'])
      expect(marksIn(words())).toEqual(['Weil'])
    })

    it('marks nothing while nothing is searched', () => {
      mountBubble(GREETING, { needle: '' })
      expect(wrapper.findAll('mark')).toEqual([])
    })
  })

  describe('a transfer without a greeting', () => {
    const plainParts = ['visually-hidden', 'chat-bubble-subject', 'memo-text', 'chat-bubble-meta']

    it('is the bubble it was: no picture, no line, the memo whole', () => {
      mountBubble(TRANSFER)

      expect(parts()).toEqual(plainParts)
      expect(row().classes()).not.toContain('chat-bubble-greeting')
      expect(picture().exists()).toBe(false)
      expect(line().exists()).toBe(false)
      expect(words().text()).toBe('Danke fürs Reparieren der Gartenbank.')
    })

    // An older server answers without the field, this one with null: the same bubble, to the letter.
    it('is the same whether the booking has no greeting or the list does not say', () => {
      const without = mountBubble(TRANSFER).html()
      wrapper.unmount()

      expect(mountBubble({ ...TRANSFER, greeting: null }).html()).toBe(without)
      wrapper.unmount()
      expect(mountBubble({ ...TRANSFER, greeting: undefined }).html()).toBe(without)
    })

    it('keeps its memo whole where it begins with what a greeting’s line could be', () => {
      mountBubble({ ...TRANSFER, body: `${LINE}\n${WORDS}` })

      expect(parts()).toEqual(plainParts)
      expect(words().text()).toBe(`${LINE}\n${WORDS}`)
    })
  })

  // Only a booking has a greeting: a message that carried the field would stay a message.
  it('draws no greeting on anything but a transfer', () => {
    mountBubble({
      id: 7,
      messageUuid: 'uuid-7',
      mine: false,
      subject: null,
      body: `${LINE}\n${WORDS}`,
      createdAt: '2026-10-02T17:42:00.000Z',
      greeting: { motif: 'morning-light', line: LINE },
    })

    expect(row().classes()).not.toContain('chat-bubble-greeting')
    expect(picture().exists()).toBe(false)
    expect(line().exists()).toBe(false)
    expect(wrapper.find('.chat-message-text').exists()).toBe(true)
  })

  /**
   * jsdom lays nothing out and reads no stylesheet, so what a test can hold is the source. The
   * measure in the real bundle -- widths, the colours on all four bubbles, the fetch of the font
   * -- is part of the delivery.
   */
  describe('in the stylesheet', () => {
    const sfc = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), 'ChatBubble.vue'),
      'utf8',
    )
    // The file explains in comments what it does; a search over the raw text would find the
    // explanation.
    const css = sfc
      .slice(sfc.indexOf('<style'), sfc.lastIndexOf('</style>'))
      .replace(/\/\*[\s\S]*?\*\//g, '')
    const rule = (selector) => {
      const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      return css.match(new RegExp(`(?:^|\\})\\s*${escaped}\\s*\\{([^}]*)\\}`))?.[1] ?? null
    }

    it('gives the bubble of a greeting all the width a bubble may have', () => {
      expect(rule('.chat-bubble-greeting .chat-bubble')).toMatch(/width:\s*80%;/)
      expect(rule('.chat-bubble')).toMatch(/max-width:\s*80%;/)
    })

    it('sets the motif in as a picture of a message is, in a room of 36 : 25', () => {
      const room = rule('.chat-bubble-greeting-picture')
      expect(room).toMatch(/margin:\s*0\.4rem -0\.5rem 0\.5rem;/)
      expect(room).toMatch(/border-radius:\s*0\.6rem;/)
      expect(room).toMatch(/aspect-ratio:\s*36 \/ 25;/)
      expect(room).toMatch(/overflow:\s*hidden;/)
      // The bubble's own padding at the sides, which the picture reaches into.
      expect(rule('.chat-bubble')).toMatch(/padding:\s*0\.45rem 0\.75rem 0\.3rem;/)
      const img = rule('.chat-bubble-greeting-picture img')
      expect(img).toMatch(/width:\s*100%;/)
      expect(img).toMatch(/height:\s*100%;/)
    })

    it('sets the line in handwriting at one and a half times the text, balanced', () => {
      const byHand = rule('.chat-bubble-greeting-line.is-by-hand')
      expect(byHand).toMatch(/font-family:\s*Caveat, 'Open Sans', sans-serif;/)
      expect(byHand).toMatch(/font-size:\s*1\.5em;/)
      expect(byHand).toMatch(/font-style:\s*normal;/)
      const plain = rule('.chat-bubble-greeting-line')
      expect(plain).toMatch(/line-height:\s*1\.15;/)
      expect(plain).toMatch(/text-wrap:\s*balance;/)
      // Without the handwriting no family is named at all: the line is the bubble's, italic.
      expect(plain).not.toMatch(/font-family/)
      expect(plain).toMatch(/font-style:\s*italic;/)
      expect(css.match(/font-family:\s*Caveat,/g)).toHaveLength(1)
    })

    it('gives the line one colour on the light bubbles and one on the dark', () => {
      expect(rule('.chat-bubble-greeting-line')).toMatch(/(^|[\s;])color:\s*#8a6124;/)
      expect(rule('.dark-mode .chat-bubble-greeting-line')).toMatch(/(^|[\s;])color:\s*#e2b55c;/)
    })

    // The face is declared once for the wallet (assets/fonts/caveat/caveat.css): taken in from
    // the script, never declared here.
    it('declares no face of its own', () => {
      expect(css).not.toMatch(/@font-face/)
      const script = sfc
        .slice(sfc.indexOf('<script'), sfc.indexOf('</script>'))
        .replace(/^\s*\/\/.*$/gm, '')
      expect(script).toMatch(/^import '@\/assets\/fonts\/caveat\/caveat\.css'$/m)
    })
  })
})
