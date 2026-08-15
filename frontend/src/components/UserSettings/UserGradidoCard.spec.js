// AI-GENERATED — not an architecture reference

import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import UserGradidoCard from './UserGradidoCard.vue'

const mockDownloadCard = vi.fn()
const mockPrintCardSheet = vi.fn()
vi.mock('@/composables/useGradidoCard', () => ({
  useGradidoCard: () => ({
    downloadCard: (...args) => mockDownloadCard(...args),
    printCardSheet: (...args) => mockPrintCardSheet(...args),
  }),
}))

const wrapperFor = () =>
  mount(UserGradidoCard, {
    global: {
      mocks: { $t: (key) => key },
      stubs: { IBiDownload: true, IBiPrinter: true },
    },
  })

describe('UserGradidoCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDownloadCard.mockResolvedValue('data:image/png;base64,card')
    mockPrintCardSheet.mockResolvedValue('data:image/png;base64,card')
  })

  // Drawing costs a query for the large picture, and this section sits on the tab the
  // settings page opens on -- so nothing may happen until somebody asks for a card.
  it('draws nothing until the button is pressed', () => {
    wrapperFor()

    expect(mockDownloadCard).not.toHaveBeenCalled()
  })

  it('hands out the card on the button', async () => {
    const wrapper = wrapperFor()

    await wrapper.find('[data-test="download-gradido-card"]').trigger('click')

    expect(mockDownloadCard).toHaveBeenCalled()
  })

  // The single image goes to a print shop or to somebody else; the sheet is for printing
  // at home. Two ways, two buttons.
  it('offers the sheet as its own way', async () => {
    const wrapper = wrapperFor()

    await wrapper.find('[data-test="print-gradido-sheet"]').trigger('click')

    expect(mockPrintCardSheet).toHaveBeenCalled()
    expect(mockDownloadCard).not.toHaveBeenCalled()
  })

  it('shows the very picture it handed over', async () => {
    const wrapper = wrapperFor()

    await wrapper.find('[data-test="download-gradido-card"]').trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('img.gradido-card-preview').attributes('src')).toBe(
      'data:image/png;base64,card',
    )
  })

  it('shows no preview when the card could not be made', async () => {
    mockDownloadCard.mockResolvedValue(null)
    const wrapper = wrapperFor()

    await wrapper.find('[data-test="download-gradido-card"]').trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('img.gradido-card-preview').exists()).toBe(false)
  })
})
