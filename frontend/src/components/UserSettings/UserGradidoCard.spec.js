// AI-GENERATED — not an architecture reference

import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import UserGradidoCard from './UserGradidoCard.vue'
import AppModal from '@/components/AppModal'

const mockDrawCard = vi.fn()
const mockDownloadCard = vi.fn()
const mockPrintCardSheet = vi.fn()
vi.mock('@/composables/useGradidoCard', () => ({
  useGradidoCard: () => ({
    drawCard: (...args) => mockDrawCard(...args),
    downloadCard: (...args) => mockDownloadCard(...args),
    printCardSheet: (...args) => mockPrintCardSheet(...args),
  }),
}))

const storeState = { username: 'bernd', gradidoID: 'uuid-1' }
vi.mock('vuex', () => ({ useStore: () => ({ state: storeState }) }))

const wrapperFor = async () => {
  const wrapper = mount(UserGradidoCard, {
    global: {
      mocks: { $t: (key) => key },
      stubs: { IBiDownload: true, IBiPrinter: true },
    },
  })
  await flushPromises()
  return wrapper
}

const typeContact = async (wrapper, text) => {
  await wrapper.find('[data-test="gradido-card-contact"]').setValue(text)
  // The redraw is held back so it does not run once per keystroke.
  vi.runAllTimers()
  await flushPromises()
}

describe('UserGradidoCard', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    window.localStorage.clear()
    storeState.username = 'bernd'
    storeState.gradidoID = 'uuid-1'
    mockDrawCard.mockResolvedValue('data:image/png;base64,preview')
    mockDownloadCard.mockResolvedValue('data:image/png;base64,card')
    mockPrintCardSheet.mockResolvedValue('data:image/png;base64,card')
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // The card is there before anybody asks for it, because somebody typing their contact
  // lines has to see where they land. What that costs is a query for the large picture --
  // and it costs nothing, because the preview takes the everyday one from the store.
  it('shows the card as soon as the page opens', async () => {
    const wrapper = await wrapperFor()

    expect(mockDrawCard).toHaveBeenCalledWith({ contact: [], preview: true })
    expect(wrapper.find('[data-test="gradido-card-preview"]').attributes('src')).toBe(
      'data:image/png;base64,preview',
    )
  })

  it('hands out the card on the button', async () => {
    const wrapper = await wrapperFor()

    await wrapper.find('[data-test="download-gradido-card"]').trigger('click')

    expect(mockDownloadCard).toHaveBeenCalled()
  })

  // The single image goes to a print shop or to somebody else; the sheet is for printing
  // at home. Two ways, two buttons.
  it('offers the sheet as its own way', async () => {
    const wrapper = await wrapperFor()

    await wrapper.find('[data-test="print-gradido-sheet"]').trigger('click')

    expect(mockPrintCardSheet).toHaveBeenCalled()
    expect(mockDownloadCard).not.toHaveBeenCalled()
  })

  it('shows the very picture it handed over', async () => {
    const wrapper = await wrapperFor()

    await wrapper.find('[data-test="download-gradido-card"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('img.gradido-card-preview').attributes('src')).toBe(
      'data:image/png;base64,card',
    )
  })

  // No card without a user name: without one the address falls back to the Gradido ID and
  // the printed line reads `.../u/<36 characters>`. A card is given away and cannot be
  // corrected, so the way to one leads through choosing a name. Both buttons are gated,
  // because both hand out the same card.
  describe('without a user name', () => {
    beforeEach(() => {
      storeState.username = ''
    })

    it('does not draw a card from the download button', async () => {
      const wrapper = await wrapperFor()

      await wrapper.find('[data-test="download-gradido-card"]').trigger('click')

      expect(mockDownloadCard).not.toHaveBeenCalled()
      expect(wrapper.findComponent(AppModal).props('modelValue')).toBe(true)
    })

    it('does not draw a sheet either', async () => {
      const wrapper = await wrapperFor()

      await wrapper.find('[data-test="print-gradido-sheet"]').trigger('click')

      expect(mockPrintCardSheet).not.toHaveBeenCalled()
      expect(wrapper.findComponent(AppModal).props('modelValue')).toBe(true)
    })

    // The message only appears once somebody asks for a card. Opening the settings page
    // should not greet a member with a warning about something they have not tried to do.
    it('says nothing until a card is asked for', async () => {
      const wrapper = await wrapperFor()

      expect(wrapper.findComponent(AppModal).props('modelValue')).toBe(false)
    })

    // Without a user name the card cannot be printed, so showing one would be an offer that
    // the buttons then refuse. The section says why instead.
    it('shows no card either, and says why', async () => {
      const wrapper = await wrapperFor()

      expect(mockDrawCard).not.toHaveBeenCalled()
      expect(wrapper.find('[data-test="gradido-card-preview"]').exists()).toBe(false)
      expect(wrapper.find('[data-test="gradido-card-empty"]').exists()).toBe(true)
    })
  })

  // A failed download must not wipe the card that is on screen: the member would be left
  // with an empty box and no idea whether the section still works.
  it('keeps the preview when the card could not be handed over', async () => {
    mockDownloadCard.mockResolvedValue(null)
    const wrapper = await wrapperFor()

    await wrapper.find('[data-test="download-gradido-card"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('img.gradido-card-preview').attributes('src')).toBe(
      'data:image/png;base64,preview',
    )
  })

  // The field looks like its result: what is typed here appears on the card beside it.
  describe('the contact lines', () => {
    it('draws them onto the card while they are typed', async () => {
      const wrapper = await wrapperFor()

      await typeContact(wrapper, 'bernd@gradido.net\n+49 7071 123456')

      expect(mockDrawCard).toHaveBeenLastCalledWith({
        contact: ['bernd@gradido.net', '+49 7071 123456'],
        preview: true,
      })
    })

    it('carries them to the download and to the sheet', async () => {
      const wrapper = await wrapperFor()
      await typeContact(wrapper, 'bernd@gradido.net')

      await wrapper.find('[data-test="download-gradido-card"]').trigger('click')
      await wrapper.find('[data-test="print-gradido-sheet"]').trigger('click')

      expect(mockDownloadCard).toHaveBeenCalledWith({ contact: ['bernd@gradido.net'] })
      expect(mockPrintCardSheet).toHaveBeenCalledWith({ contact: ['bernd@gradido.net'] })
    })

    it('counts what will be printed, not what was typed', async () => {
      const wrapper = await wrapperFor()

      await typeContact(wrapper, 'one\n\n  \ntwo')

      expect(wrapper.find('[data-test="gradido-card-contact-count"]').text()).toBe(
        'gradido-card.contact-count',
      )
      expect(mockDrawCard).toHaveBeenLastCalledWith({ contact: ['one', 'two'], preview: true })
    })

    // Six typed lines print five. Saying so is the whole difference between a limit and a
    // silent truncation.
    it('warns instead of quietly dropping the sixth line', async () => {
      const wrapper = await wrapperFor()

      await typeContact(wrapper, ['a', 'b', 'c', 'd', 'e', 'f'].join('\n'))

      const count = wrapper.find('[data-test="gradido-card-contact-count"]')
      expect(count.text()).toBe('gradido-card.contact-too-many')
      expect(count.classes()).toContain('text-warning')
    })
  })

  // Cancelling a timer stops a draw that has not started. It does nothing about one that is
  // already running -- and on a slow device the older of two draws can finish last.
  it('lets no older draw overwrite a newer preview', async () => {
    const wrapper = await wrapperFor()

    let finishFirst
    mockDrawCard.mockImplementationOnce(
      () => new Promise((resolve) => (finishFirst = () => resolve('data:image/png;base64,older'))),
    )
    await typeContact(wrapper, 'older')

    mockDrawCard.mockResolvedValueOnce('data:image/png;base64,newer')
    await typeContact(wrapper, 'newer')

    // ... and only now does the first one come back
    finishFirst()
    await flushPromises()

    expect(wrapper.find('[data-test="gradido-card-preview"]').attributes('src')).toBe(
      'data:image/png;base64,newer',
    )
  })

  // Kept on the device, under the member's own Gradido ID -- so a shared browser does not
  // show the previous person's telephone number to the next one.
  describe('remembering on this device', () => {
    it('brings the lines back on the next visit', async () => {
      const wrapper = await wrapperFor()
      await typeContact(wrapper, 'bernd@gradido.net')

      const again = await wrapperFor()

      expect(again.find('[data-test="gradido-card-contact"]').element.value).toBe(
        'bernd@gradido.net',
      )
      expect(wrapper.exists()).toBe(true)
    })

    // Null is a state the wallet really passes through: before the login response arrives and
    // again after logging out. A fallback key would be shared by everybody who ever has none,
    // which is exactly the leak the key is here to prevent.
    it('remembers nothing at all while there is no Gradido ID', async () => {
      storeState.gradidoID = null
      const wrapper = await wrapperFor()

      await typeContact(wrapper, 'bernd@gradido.net')

      expect(Object.keys(window.localStorage)).toHaveLength(0)

      const next = await wrapperFor()
      expect(next.find('[data-test="gradido-card-contact"]').element.value).toBe('')
    })

    it('shows nothing to the next member on the same browser', async () => {
      const wrapper = await wrapperFor()
      await typeContact(wrapper, 'bernd@gradido.net')

      storeState.gradidoID = 'uuid-2'
      const other = await wrapperFor()

      expect(other.find('[data-test="gradido-card-contact"]').element.value).toBe('')
      expect(mockDrawCard).toHaveBeenLastCalledWith({ contact: [], preview: true })
    })
  })
})
