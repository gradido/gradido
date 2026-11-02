// AI-GENERATED — not an architecture reference
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { BButton } from 'bootstrap-vue-next'
import i18n from '@/i18n'
import ClipboardCopy from './ClipboardCopy'

const mockToastSuccess = vi.fn()
const mockToastError = vi.fn()
vi.mock('@/composables/useToast', () => ({
  useAppToast: () => ({ toastSuccess: mockToastSuccess, toastError: mockToastError }),
}))

vi.mock('@/store/useWalletStore', () => ({
  useWalletStore: () => ({ username: 'bernd', gradidoID: 'uuid-1' }),
}))

const LINK = 'https://gdd.gradido.net/redeem/7f3a9c1e84b2'

const writeText = vi.fn()
const share = vi.fn()

// The real composable and the real German texts: what this page shows and what its button
// sends have to be the same text, and only the real ones can say so.
const mountCopy = () => {
  i18n.global.locale.value = 'de'
  return mount(ClipboardCopy, {
    props: {
      link: LINK,
      amount: '37',
      memo: 'Für Deine Hilfe am Samstag',
      validUntil: '2026-10-01T12:00:00Z',
    },
    global: {
      plugins: [i18n],
      components: { BButton },
      stubs: { IBiShare: true, IBiEnvelope: true, IBiLock: true, IBiCopy: true },
    },
  })
}

describe('ClipboardCopy', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    writeText.mockResolvedValue(undefined)
    share.mockResolvedValue(undefined)
    Object.defineProperty(window.navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    })
    Object.defineProperty(window.navigator, 'share', { value: share, configurable: true })
  })

  afterEach(() => {
    delete window.navigator.clipboard
    delete window.navigator.share
  })

  // "Per E-Mail" (ZE-037): a plain link has no picture, so this only opens the mail program.
  it('offers the mail program under sharing, with the text it shows', () => {
    const wrapper = mountCopy()
    const button = wrapper.find('[data-test="emailButton"]')
    const url = new URL(button.attributes('href'))

    expect(button.element.tagName).toBe('A')
    expect(button.text()).toBe('Per E-Mail')
    expect(url.pathname).toBe('')
    expect(url.searchParams.get('subject')).toBe('Ein Dank von bernd')
    expect(url.searchParams.get('body')).toBe(
      wrapper.find('[data-test="copyLinkWithText"]').text().replace(/\n/g, '\r\n'),
    )
    expect(wrapper.find('[data-test="emailHint"]').text()).toBe('Öffnet Dein E-Mail-Programm.')
    // A link in the words of a screen reader too: a "button" would be pressed with the space bar,
    // and a link does not answer to that.
    expect(button.attributes('role')).toBe('link')
  })

  it('sends with its button exactly the text it shows', async () => {
    const wrapper = mountCopy()
    await wrapper.find('[data-test="shareButton"]').trigger('click')
    await flushPromises()

    expect(share).toHaveBeenCalledTimes(1)
    expect(share.mock.calls[0][0].text).toBe(wrapper.find('[data-test="copyLinkWithText"]').text())
  })

  it('names the button "Teilen"', () => {
    expect(mountCopy().find('[data-test="shareButton"]').text()).toBe('Teilen')
  })

  // The sentence moved from the message to the sender's screen: under the button, and no
  // longer in the text the button sends.
  it('tells the sender, and only the sender, that whoever has the link can redeem it', () => {
    const wrapper = mountCopy()
    const hint =
      'Wer den Link hat, kann ihn einlösen. Schick ihn nur dem Menschen, für den er gedacht ist.'

    expect(wrapper.find('[data-test="linkHint"]').text()).toBe(hint)
    expect(wrapper.find('[data-test="copyLinkWithText"]').text()).not.toContain(hint)
  })

  it('keeps copying the link and the text as the way without a share sheet', async () => {
    delete window.navigator.share
    const wrapper = mountCopy()
    await wrapper.find('[data-test="shareButton"]').trigger('click')
    await flushPromises()

    expect(writeText).toHaveBeenCalledWith(wrapper.find('[data-test="copyLinkWithText"]').text())
    expect(wrapper.find('[data-test="copyLink"]').text()).toBe(LINK)
  })
})
