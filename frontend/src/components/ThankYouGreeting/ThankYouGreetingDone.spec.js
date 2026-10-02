// AI-GENERATED — not an architecture reference
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import ThankYouGreetingDone from './ThankYouGreetingDone.vue'

const toast = vi.hoisted(() => ({ toastSuccess: vi.fn(), toastError: vi.fn() }))
vi.mock('@/composables/useToast', () => ({ useAppToast: () => toast }))
vi.mock('vuex', () => ({
  useStore: () => ({ state: { username: 'Oma-Emma', gradidoID: 'uuid-emma' } }),
}))

const LINK = 'https://ki-playground.gradido.net/redeem/a3f9c2d41b7e19981fa0c4e2'
const WORDS = 'Liebe Sarah, mit Eurem iPad hat alles angefangen.'

// The server's answer to createTransactionLink. Noon, so no time zone moves the day.
const created = (greeting = {}) => ({
  link: LINK,
  amount: '20',
  memo: `Einfach so — weil es Dich gibt.\n${WORDS}`,
  validUntil: '2026-10-16T12:00:00.000Z',
  greeting: {
    motif: 'morning-light',
    line: 'Einfach so — weil es Dich gibt.',
    recipientName: 'Sarah',
    ...greeting,
  },
})

const done = (answer = created()) =>
  mount(ThankYouGreetingDone, { props: { created: answer }, global: { plugins: [i18n] } })

const data = (wrapper, name) => wrapper.find(`[data-test="thank-you-greeting-${name}"]`)

const share = vi.fn()
const writeText = vi.fn()

describe('ThankYouGreetingDone', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    i18n.global.locale.value = 'de'
    share.mockResolvedValue(undefined)
    writeText.mockResolvedValue(undefined)
    Object.defineProperty(window.navigator, 'share', { value: share, configurable: true })
    Object.defineProperty(window.navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    })
  })

  afterEach(() => {
    delete window.navigator.share
    delete window.navigator.clipboard
  })

  it('says the greeting is ready, for whom, and until when it waits', () => {
    const wrapper = done()

    expect(data(wrapper, 'done-title').text()).toBe('Dein Dank-Gruß für Sarah ist fertig.')
    expect(data(wrapper, 'done-waits').text()).toBe('Er wartet bis zum 16.10.2026.')
  })

  it('says it without a name where the greeting names nobody', () => {
    for (const recipientName of [null, '']) {
      const wrapper = done(created({ recipientName }))

      expect(data(wrapper, 'done-title').text()).toBe('Dein Dank-Gruß ist fertig.')
    }
  })

  it('shows the motif small, under its name', () => {
    const motif = data(done(), 'done-motif')

    expect(motif.element.tagName).toBe('IMG')
    expect(motif.attributes('src')).toBe('/img/thank-you-greeting/morning-light.svg')
    expect(motif.attributes('alt')).toBe('Morgenlicht')
  })

  it('shows no picture for a motif this wallet does not know', () => {
    expect(data(done(created({ motif: 'sunset' })), 'done-motif').exists()).toBe(false)
  })

  // ZE-017, F3: in the first person, without the sender's words and without the amount.
  describe('the sentence that goes out', () => {
    const SENTENCE = [
      'Sarah, ich habe einen Dank-Gruß für Dich:',
      LINK,
      'Er wartet bis zum 16.10.2026 auf Dich. Nimmst Du ihn nicht an, passiert nichts.',
    ].join('\n')

    it('stands there word for word, with the link on a line of its own', () => {
      const wrapper = done()

      expect(wrapper.text()).toContain('Dieser Satz geht mit auf die Reise:')
      expect(data(wrapper, 'share-text').element.textContent.trim()).toBe(SENTENCE)
    })

    it('carries neither the sender’s words nor the line nor the amount', () => {
      const text = data(done(created({ amount: '37.5' })), 'share-text').text()

      expect(text).not.toContain(WORDS)
      expect(text).not.toContain('weil es Dich gibt')
      expect(text).not.toMatch(/37|Gradido|GDD/)
      expect(text).not.toContain('Oma-Emma')
    })

    it('begins without a name where the greeting has none', () => {
      const text = data(done(created({ recipientName: null })), 'share-text').element.textContent

      expect(text.trim().split('\n')[0]).toBe('Ich habe einen Dank-Gruß für Dich:')
    })

    it('is what "Teilen" hands to the device, with the link in it once', async () => {
      const wrapper = done()
      await data(wrapper, 'share').trigger('click')
      await flushPromises()

      expect(share).toHaveBeenCalledTimes(1)
      expect(share).toHaveBeenCalledWith({ text: SENTENCE })
    })

    // The message after copying does not speak of "your message": that one does not travel.
    it('is copied where the device has no share sheet, with a message of its own', async () => {
      share.mockRejectedValue(new Error('no share sheet'))
      const wrapper = done()
      await data(wrapper, 'share').trigger('click')
      await flushPromises()

      expect(writeText).toHaveBeenCalledWith(SENTENCE)
      expect(toast.toastSuccess).toHaveBeenCalledWith(
        'Der Satz und der Link wurden in die Zwischenablage kopiert. Du kannst sie jetzt in eine E-Mail oder Nachricht einfügen.',
      )
      expect(toast.toastSuccess.mock.calls[0][0]).not.toContain('Deine Nachricht')
    })
  })

  it('copies the link alone with "Link kopieren"', async () => {
    const wrapper = done()
    expect(data(wrapper, 'copy').text()).toBe('Link kopieren')

    await data(wrapper, 'copy').trigger('click')
    await flushPromises()

    expect(writeText).toHaveBeenCalledWith(LINK)
  })

  it('says how to treat the link and where to find the greeting again', () => {
    const wrapper = done()

    expect(wrapper.text()).toContain(
      'Den Satz kannst Du vor dem Senden ändern. Deine Worte stehen erst auf der Karte.',
    )
    expect(data(wrapper, 'link-hint').text()).toBe(
      'Wer den Link hat, kann den Dank annehmen. Schick ihn nur dem Menschen, für den er gedacht ist.',
    )
    // The two names are the ones the menu and the list carry.
    expect(data(wrapper, 'find-again').text()).toBe(
      'Du findest ihn wieder unter Transaktionen, bei „Links, Schecks, QR-Codes“.',
    )
  })

  // Slice 6: nothing to print and no picture to save yet.
  it('offers sharing and copying, and nothing else', () => {
    expect(
      done()
        .findAll('button')
        .map((button) => button.text()),
    ).toEqual(['Teilen', 'Link kopieren'])
  })

  // The wallet knows no gender: the name stands there, or the sentence does without.
  it('has no pronoun for the receiver', () => {
    for (const wrapper of [done(), done(created({ recipientName: null }))]) {
      expect(data(wrapper, 'done-waits').text()).toBe('Er wartet bis zum 16.10.2026.')
      expect(wrapper.text()).not.toMatch(/auf (sie|ihn)\b/)
    }
  })
})
