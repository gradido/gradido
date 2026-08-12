import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createStore } from 'vuex'
import ContributionLinkList from './ContributionLinkList.vue'
import { BButton, BCard, BCardText, BModal, BTable } from 'bootstrap-vue-next'
import * as apolloComposable from '@vue/apollo-composable'

const createVuexStore = (roles = ['ADMIN']) => createStore({ state: { moderator: { roles } } })

vi.mock('vue-i18n', () => ({
  useI18n: vi.fn(() => ({
    // The values are kept in the returned string so that a test can see which numbers
    // and dates went into a sentence, not only which key was picked.
    t: (key, values) => (values ? `${key} ${JSON.stringify(values)}` : key),
    d: (date) => date.toISOString(),
  })),
}))

const mockDrawCheque = vi.fn(() => Promise.resolve('data:image/png;base64,AAAA'))
vi.mock('@/utils/thankYouCheque', () => ({
  drawCheque: (...args) => mockDrawCheque(...args),
  chequeFileName: (occasion, amount) => `${amount} GDD - ${occasion}.png`,
}))

const mockQrCanvas = { width: 360 }
const mockRenderQrCodeCanvas = vi.fn(() => Promise.resolve(mockQrCanvas))
vi.mock('@/utils/qrCode', () => ({
  renderQrCodeCanvas: (...args) => mockRenderQrCodeCanvas(...args),
}))

vi.mock('@/config', () => ({ default: { COMMUNITY_NAME: 'KI Playground' } }))

vi.mock('@vue/apollo-composable', () => ({
  useMutation: vi.fn(() => ({
    mutate: vi.fn(),
  })),
}))

// Mock useAppToast
const mockToastError = vi.fn()
const mockToastSuccess = vi.fn()
vi.mock('@/composables/useToast', () => ({
  useAppToast: vi.fn(() => ({
    toastError: mockToastError,
    toastSuccess: mockToastSuccess,
  })),
}))

describe('ContributionLinkList', () => {
  let wrapper
  let mutateMock

  const createWrapper = (roles = ['ADMIN']) => {
    return mount(ContributionLinkList, {
      props: {
        items: [
          {
            id: 1,
            name: 'Meditation',
            memo: 'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut l',
            amount: '200',
            validFrom: '2022-04-01',
            validTo: '2022-08-01',
            cycle: 'täglich',
            maxPerCycle: '3',
            maxAmountPerMonth: 0,
            link: 'https://localhost/redeem/CL-1a2345678',
          },
        ],
      },
      global: {
        plugins: [createVuexStore(roles)],
        components: {
          BTable,
          BButton,
          BModal,
          BCard,
          BCardText,
        },
        stubs: {
          IBiTrash: true,
          IBiPencil: true,
          IBiEye: true,
          IBiDownload: true,
          FigureQrCode: true,
        },
      },
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mutateMock = vi.fn()
    vi.spyOn(apolloComposable, 'useMutation').mockReturnValue({ mutate: mutateMock })
    wrapper = createWrapper()
  })

  it('renders the Div Element ".contribution-link-list"', () => {
    expect(wrapper.find('div.contribution-link-list').exists()).toBe(true)
  })

  it('renders table with contribution link', () => {
    expect(wrapper.findComponent({ name: 'BTable' }).exists()).toBe(true)
  })

  describe('edit contribution link', () => {
    it('emits editContributionLinkData', async () => {
      await wrapper.vm.editContributionLink({ id: 1 })
      expect(wrapper.emitted('edit-contribution-link-data')).toBeTruthy()
    })
  })

  describe('delete contribution link', () => {
    describe('with success', () => {
      beforeEach(async () => {
        mutateMock.mockResolvedValue({})
        await wrapper.vm.handleDelete({ item: { id: 1, name: 'Test' } })
        await wrapper.vm.executeDelete()
      })

      it('calls the mutation and emits events', async () => {
        expect(mutateMock).toHaveBeenCalledWith({ id: 1 })
        expect(wrapper.emitted('close-contribution-form')).toBeTruthy()
        expect(wrapper.emitted('get-contribution-links')).toBeTruthy()
      })

      it('toasts a success message', () => {
        expect(mockToastSuccess).toHaveBeenCalledWith('contributionLink.deleted')
      })
    })

    describe('with error', () => {
      beforeEach(async () => {
        mutateMock.mockRejectedValue(new Error('Something went wrong :('))
        await wrapper.vm.handleDelete({ item: { id: 1, name: 'Test' } })
        await wrapper.vm.executeDelete()
      })

      it('toasts an error message', () => {
        expect(mockToastError).toHaveBeenCalledWith('Something went wrong :(')
      })
    })
  })

  // Only administrators may change a starting balance. A moderator keeps the "show" column,
  // which reveals the link and its QR code — that is what they pass on to members.
  describe('as a moderator', () => {
    beforeEach(() => {
      wrapper = createWrapper(['MODERATOR'])
    })

    it('leaves out the delete and edit columns', () => {
      expect(wrapper.vm.fields).not.toContain('delete')
      expect(wrapper.vm.fields).not.toContain('edit')
    })

    it('keeps the column that reveals the link', () => {
      expect(wrapper.vm.fields).toContain('show')
    })
  })

  describe('as an administrator', () => {
    it('offers delete and edit', () => {
      expect(wrapper.vm.fields).toContain('delete')
      expect(wrapper.vm.fields).toContain('edit')
    })
  })

  // The starting bonus cheque. The button sits in the row next to the eye, so the code
  // it prints is drawn off screen -- the modal that shows one is closed at that moment.
  describe('download the starting bonus cheque', () => {
    const link = {
      name: 'Startguthaben Gradido-Cafe',
      memo: 'Dein Startguthaben!',
      amount: '20',
      validFrom: '2026-08-01',
      validTo: '2026-09-30',
      link: 'https://localhost/redeem/CL-1a2345678',
    }

    let anchor
    let createElement

    beforeEach(() => {
      anchor = { href: '', download: '', click: vi.fn() }
      const original = document.createElement.bind(document)
      createElement = vi
        .spyOn(document, 'createElement')
        .mockImplementation((tag) => (tag === 'a' ? anchor : original(tag)))
    })

    afterEach(() => {
      createElement.mockRestore()
    })

    it('offers the button in every row, to moderators as well', () => {
      expect(wrapper.find('.test-download-cheque').exists()).toBe(true)
      expect(createWrapper(['MODERATOR']).vm.fields).toContain('cheque')
    })

    it('draws the code of the link that was clicked', async () => {
      await wrapper.find('.test-download-cheque').trigger('click')

      expect(mockRenderQrCodeCanvas).toHaveBeenCalledWith('https://localhost/redeem/CL-1a2345678')
    })

    it('puts the community, the amount and both dates on the cheque', async () => {
      await wrapper.vm.downloadCheque(link)

      expect(mockDrawCheque).toHaveBeenCalledWith({
        kind: 'startingBonus',
        community: 'KI Playground',
        headline: 'thank-you-cheque.starting-credit {"amount":"20"}',
        memo: 'Dein Startguthaben!',
        hintLine: 'thank-you-cheque.scan-qr',
        validLine:
          'thank-you-cheque.starting-credit-valid {"from":"2026-08-01T00:00:00.000Z","to":"2026-09-30T00:00:00.000Z"}',
        qrCanvas: mockQrCanvas,
      })
      expect(anchor.download).toBe('20 GDD - Startguthaben Gradido-Cafe.png')
      expect(anchor.href).toBe('data:image/png;base64,AAAA')
      expect(anchor.click).toHaveBeenCalled()
    })

    // A link may run without an end date. Half a sentence would read like a mistake, and
    // a date that was never set must not be invented.
    it('leaves the validity out when a date is missing', async () => {
      await wrapper.vm.downloadCheque({ ...link, validTo: null })

      expect(mockDrawCheque).toHaveBeenCalledWith(expect.objectContaining({ validLine: '' }))
    })

    it('says so when a picture of the cheque cannot be loaded', async () => {
      mockDrawCheque.mockRejectedValueOnce(
        new Error('cannot load image: /img/template/Blaetter.png'),
      )

      await wrapper.vm.downloadCheque(link)

      expect(mockToastError).toHaveBeenCalledWith('cannot load image: /img/template/Blaetter.png')
      expect(anchor.click).not.toHaveBeenCalled()
    })
  })
})
