import { mount } from '@vue/test-utils'
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
    },
    mutations: {
      language(state, lang) {
        state.language = lang
      },
    },
  })

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
  })
})
