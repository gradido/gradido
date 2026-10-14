import { flushPromises, mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import LanguageSwitch from './LanguageSwitch2.vue'
import locales from '@/locales/'
import { createStore } from 'vuex'
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

  const store = createStore({
    state: {
      gradidoID: 'current-user-id',
      language: null,
      preLoginLanguage: null,
      token: 'token',
      tokenTime: null,
    },
    mutations: {
      language(state, lang) {
        state.language = lang
      },
      setPreLoginLanguage(state, lang) {
        state.preLoginLanguage = lang
      },
    },
  })
  // When the session ends, in seconds by this device's clock (the `token` mutation in store.js).
  const inSeconds = (seconds) => Math.floor(Date.now() / 1000) + seconds

  const i18n = createI18n({
    legacy: false,
    locale: 'en',
    messages: {},
  })

  const mountOptions = {
    global: {
      plugins: [store, i18n],
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

  beforeEach(() => {
    vi.clearAllMocks()
    // A member whose session runs for another hour.
    store.state.gradidoID = 'current-user-id'
    store.state.token = 'token'
    store.state.tokenTime = inSeconds(3600)
    store.state.preLoginLanguage = null
    wrapper = createWrapper()
  })

  it('renders the component', () => {
    expect(wrapper.find('div.language-switch').exists()).toBe(true)
  })

  describe('current language label (the trigger)', () => {
    it('defaults to the navigator language English when the store is empty', async () => {
      const languageGetter = vi.spyOn(navigator, 'language', 'get')
      languageGetter.mockReturnValue('en-US')
      store.state.language = null
      await wrapper.vm.setCurrentLanguage()
      expect(wrapper.find('.ls-current').text()).toBe('English')
    })

    it('falls back to English when there is no navigator language', async () => {
      const languageGetter = vi.spyOn(navigator, 'language', 'get')
      languageGetter.mockReturnValue(null)
      store.state.language = null
      await wrapper.vm.setCurrentLanguage()
      expect(wrapper.find('.ls-current').text()).toBe('English')
    })

    it('shows the stored language as its autonym', async () => {
      store.state.language = 'es'
      await wrapper.vm.setCurrentLanguage()
      expect(wrapper.find('.ls-current').text()).toBe('Español')
    })
  })

  describe('the language menu', () => {
    beforeEach(async () => {
      store.state.language = 'de'
      await wrapper.vm.setCurrentLanguage()
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
      store.state.language = 'en'
      await wrapper.vm.setCurrentLanguage()
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
      expect(store.state.preLoginLanguage).toBe(null)
    })
  })

  // Asked with a session that has run out, the server signs the member out, and the wallet
  // sends them to the sign-in page: what they had typed on the page they were on was gone.
  describe('selecting a language without a running session', () => {
    beforeEach(async () => {
      store.state.language = 'en'
      await wrapper.vm.setCurrentLanguage()
    })

    it.each([
      ['a member whose session has run out', () => (store.state.tokenTime = inSeconds(-60))],
      // The margin the router's guard allows too (`sessionRuns` in routes/guards.js).
      [
        'a member whose session ends within five seconds',
        () => (store.state.tokenTime = inSeconds(4)),
      ],
      ['a member without a token', () => (store.state.token = null)],
      ['nobody signed in', () => (store.state.gradidoID = null)],
    ])(
      'does not ask the server for %s, and keeps the choice for the next sign-in',
      async (_who, set) => {
        set()
        await itemByCode(wrapper, 'de').trigger('click')
        await flushPromises()

        expect(updateUserInfosMutationMock).not.toHaveBeenCalled()
        expect(store.state.language).toBe('de')
        expect(store.state.preLoginLanguage).toBe('de')
        expect(mockToastSuccess).not.toHaveBeenCalled()
        expect(mockToastError).not.toHaveBeenCalled()
      },
    )
  })
})
