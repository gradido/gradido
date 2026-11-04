import { flushPromises, mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { LanguageSwitch2 as LanguageSwitch } from './LanguageSwitch2'
import locales from '@/locales/'
import { walletStore } from '@test/walletStore'
import { useWalletStore } from '@/store/useWalletStore'
import { createI18n } from 'vue-i18n'

const updateUserInfosMutationMock = vi.fn().mockResolvedValue({
  data: {
    updateUserInfos: {
      validValues: 1,
    },
  },
})

vi.mock('@vue/apollo-composable', async () => {
  const actual = await vi.importActual('@vue/apollo-composable')
  return {
    ...actual,
    useMutation: vi.fn(() => ({
      mutate: updateUserInfosMutationMock,
    })),
  }
})

const mockToastError = vi.fn()
const mockToastSuccess = vi.fn()
vi.mock('@/composables/useToast', () => ({
  useAppToast: vi.fn(() => ({
    toastError: mockToastError,
    toastSuccess: mockToastSuccess,
  })),
}))

const enabledLocales = locales.filter((lang) => lang.enabled)
const nameByCode = (code) => locales.find((lang) => lang.code === code).name
const itemByCode = (wrapper, code) =>
  wrapper.findAll('.ls-item').find((item) => item.find('.ls-item-name').text() === nameByCode(code))

describe('LanguageSwitch2', () => {
  let wrapper

  const pinia = walletStore({
    gradidoID: 'current-user-id',
    language: null,
    preLoginLanguage: null,
    token: 'token',
    tokenTime: null,
  })
  const store = useWalletStore(pinia)
  // When the session ends, in seconds by this device's clock (`setToken` in useWalletStore.js).
  const inSeconds = (seconds) => Math.floor(Date.now() / 1000) + seconds

  const i18n = createI18n({
    legacy: false,
    locale: 'en',
    messages: {},
  })

  const mountOptions = {
    global: {
      plugins: [pinia, i18n],
      mocks: {
        $apollo: {
          mutate: updateUserInfosMutationMock,
        },
      },
    },
  }

  const createWrapper = () => {
    return mount(LanguageSwitch, mountOptions)
  }

  // The language shown is settled when the switch mounts: from the store, else the browser's.
  const remount = async () => {
    wrapper.unmount()
    wrapper = createWrapper()
    await flushPromises()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // A member whose session runs for another hour.
    store.gradidoID = 'current-user-id'
    store.token = 'token'
    store.tokenTime = inSeconds(3600)
    store.preLoginLanguage = null
    wrapper = createWrapper()
  })

  it('renders the component', () => {
    expect(wrapper.find('div.language-switch').exists()).toBe(true)
  })

  describe('opening and closing the menu', () => {
    const menu = () => wrapper.find('.ls-menu')
    // v-show: the list stays in the page and is hidden by its style
    const menuShown = () => menu().element.style.display !== 'none'

    it('is closed at first', () => {
      expect(menuShown()).toBe(false)
      expect(wrapper.find('.ls-trigger').attributes('aria-expanded')).toBe('false')
    })

    it('opens and closes with the trigger', async () => {
      await wrapper.find('.ls-trigger').trigger('click')
      expect(menuShown()).toBe(true)
      expect(wrapper.find('.ls-trigger').attributes('aria-expanded')).toBe('true')
      await wrapper.find('.ls-trigger').trigger('click')
      expect(menuShown()).toBe(false)
    })

    it('closes on a click elsewhere on the page, not on one inside it', async () => {
      wrapper.unmount()
      wrapper = mount(LanguageSwitch, { ...mountOptions, attachTo: document.body })
      await wrapper.find('.ls-trigger').trigger('click')
      wrapper.find('.ls-menu').element.click()
      await flushPromises()
      expect(menuShown()).toBe(true)
      document.body.click()
      await flushPromises()
      expect(menuShown()).toBe(false)
    })

    it('closes when a language is chosen', async () => {
      await wrapper.find('.ls-trigger').trigger('click')
      await wrapper.findAll('.ls-item')[1].trigger('click')
      expect(menuShown()).toBe(false)
    })
  })

  describe('current language label (the trigger)', () => {
    it('defaults to the navigator language English when the store is empty', async () => {
      const languageGetter = vi.spyOn(navigator, 'language', 'get')
      languageGetter.mockReturnValue('en-US')
      store.language = null
      await remount()
      expect(wrapper.find('.ls-current').text()).toBe('English')
    })

    it('falls back to English when there is no navigator language', async () => {
      const languageGetter = vi.spyOn(navigator, 'language', 'get')
      languageGetter.mockReturnValue(null)
      store.language = null
      await remount()
      expect(wrapper.find('.ls-current').text()).toBe('English')
    })

    it('shows the stored language as its autonym', async () => {
      store.language = 'es'
      await remount()
      expect(wrapper.find('.ls-current').text()).toBe('Español')
    })
  })

  describe('the language menu', () => {
    beforeEach(async () => {
      store.language = 'de'
      await remount()
    })

    it('offers every enabled language to choose from', () => {
      expect(wrapper.findAll('.ls-item').length).toBe(enabledLocales.length)
    })

    it('puts the current language first and marks it active', () => {
      const first = wrapper.findAll('.ls-item')[0]
      expect(first.find('.ls-item-name').text()).toBe('Deutsch')
      expect(first.classes()).toContain('ls-item-active')
    })

    it('sorts the remaining languages alphabetically by autonym', () => {
      const names = wrapper
        .findAll('.ls-item')
        .slice(1)
        .map((item) => item.find('.ls-item-name').text())
      const expected = [...names].sort((a, b) => a.localeCompare(b))
      expect(names).toEqual(expected)
    })
  })

  describe('selecting a language calls the API', () => {
    beforeEach(async () => {
      store.language = 'en'
      await remount()
    })

    it.each([['de'], ['es'], ['fr'], ['nl']])('with locale "%s"', async (code) => {
      await itemByCode(wrapper, code).trigger('click')
      await vi.waitFor(() => {
        expect(updateUserInfosMutationMock).toHaveBeenCalledWith({ locale: code })
      })
    })

    it('says that it is saved, and keeps nothing for a later sign-in', async () => {
      await itemByCode(wrapper, 'de').trigger('click')
      await flushPromises()

      expect(mockToastSuccess).toHaveBeenCalledTimes(1)
      expect(store.preLoginLanguage).toBe(null)
    })
  })

  // Asked with a session that has run out, the server signs the member out, and the wallet
  // sends them to the sign-in page: what they had typed on the page they were on was gone.
  describe('selecting a language without a running session', () => {
    beforeEach(async () => {
      store.language = 'en'
      await remount()
    })

    it.each([
      ['a member whose session has run out', () => (store.tokenTime = inSeconds(-60))],
      // The margin the router's guard allows too (`sessionRuns` in routes/guards.js).
      ['a member whose session ends within five seconds', () => (store.tokenTime = inSeconds(4))],
      ['a member without a token', () => (store.token = null)],
      ['nobody signed in', () => (store.gradidoID = null)],
    ])(
      'does not ask the server for %s, and keeps the choice for the next sign-in',
      async (_who, set) => {
        set()
        await itemByCode(wrapper, 'de').trigger('click')
        await flushPromises()

        expect(updateUserInfosMutationMock).not.toHaveBeenCalled()
        expect(store.language).toBe('de')
        expect(store.preLoginLanguage).toBe('de')
        expect(mockToastSuccess).not.toHaveBeenCalled()
        expect(mockToastError).not.toHaveBeenCalled()
      },
    )
  })
})
