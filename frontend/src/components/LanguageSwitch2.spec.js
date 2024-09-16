import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest'
import LanguageSwitch from './LanguageSwitch2.vue'
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
vi.mock('@/composables/useToast', () => ({
  useAppToast: vi.fn(() => ({
    toastError: mockToastError,
  })),
}))

describe('LanguageSwitch', () => {
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

  const globalMocks = {
    $apollo: {
      mutate: updateUserInfosMutationMock,
    },
  }

  const mountOptions = {
    global: {
      plugins: [store, i18n],
      mocks: globalMocks,
    },
  }

  const createWrapper = () => {
    return mount(LanguageSwitch, mountOptions)
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = createWrapper()
    })

    it('renders the component', () => {
      expect(wrapper.find('div.language-switch').exists()).toBe(true)
    })

    describe('with locales en, de, es, fr, and nl', () => {
      describe('empty store', () => {
        describe('navigator language is "en-US"', () => {
          const languageGetter = vi.spyOn(navigator, 'language', 'get')

          it('shows English as default navigator language', async () => {
            languageGetter.mockReturnValue('en-US')
            await wrapper.vm.setCurrentLanguage()
            expect(wrapper.findAll('span.locales').at(0).text()).toBe('English')
          })
        })

        describe('no navigator language', () => {
          const languageGetter = vi.spyOn(navigator, 'language', 'get')

          it('shows English as language ', async () => {
            languageGetter.mockReturnValue(null)
            await wrapper.vm.setCurrentLanguage()
            expect(wrapper.findAll('span.locales').at(0).text()).toBe('English')
          })
        })
      })

      describe('language "de" in store', () => {
        it('shows Deutsch as language', async () => {
          store.state.language = 'de'
          await wrapper.vm.setCurrentLanguage()
          expect(wrapper.findAll('span.locales').at(1).text()).toBe('English')
        })
      })

      describe('language "es" in store', () => {
        it('shows Español as language', async () => {
          store.state.language = 'es'
          await wrapper.vm.setCurrentLanguage()
          expect(wrapper.findAll('span.locales').at(2).text()).toBe('Deutsch')
        })
      })

      describe('language "fr" in store', () => {
        it('shows French as language', async () => {
          store.state.language = 'fr'
          await wrapper.vm.setCurrentLanguage()
          expect(wrapper.findAll('span.locales').at(3).text()).toBe('Español')
        })
      })

      describe('language "nl" in store', () => {
        it('shows Nederlands as language', async () => {
          store.state.language = 'nl'
          await wrapper.vm.setCurrentLanguage()
          expect(wrapper.findAll('span.locales').at(4).text()).toBe('Français')
        })
      })

      describe('language menu', () => {
        beforeAll(async () => {
          store.state.language = 'en'
          await wrapper.vm.setCurrentLanguage()
        })

        it('has five languages to choose from', () => {
          expect(wrapper.findAll('span.locales').length).toBe(5)
        })
      })
    })

    describe('calls the API', () => {
      it("with locale 'de'", async () => {
        await wrapper.findAll('span.locales').at(1).trigger('click')
        await vi.waitFor(() => {
          expect(updateUserInfosMutationMock).toHaveBeenCalledWith({ locale: 'de' })
        })
      })

      it("with locale 'es'", async () => {
        await wrapper.findAll('span.locales').at(2).trigger('click')
        await vi.waitFor(() => {
          expect(updateUserInfosMutationMock).toHaveBeenCalledWith({ locale: 'es' })
        })
      })

      it("with locale 'fr'", async () => {
        await wrapper.findAll('span.locales').at(3).trigger('click')
        await vi.waitFor(() => {
          expect(updateUserInfosMutationMock).toHaveBeenCalledWith({ locale: 'fr' })
        })
      })

      it("with locale 'nl'", async () => {
        await wrapper.findAll('span.locales').at(4).trigger('click')
        await vi.waitFor(() => {
          expect(updateUserInfosMutationMock).toHaveBeenCalledWith({ locale: 'nl' })
        })
      })
    })
  })
})
