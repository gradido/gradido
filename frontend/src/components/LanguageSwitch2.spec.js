import { mount } from '@vue/test-utils'
import LanguageSwitch from './LanguageSwitch2'

const localVue = global.localVue

const updateUserInfosMutationMock = jest.fn().mockResolvedValue({
  data: {
    updateUserInfos: {
      validValues: 1,
    },
  },
})

describe('LanguageSwitch', () => {
  let wrapper

  const state = {
    email: 'he@ho.he',
    language: null,
  }

  const mocks = {
    $store: {
      state,
      commit: jest.fn(),
    },
    $i18n: {
      locale: 'en',
    },
    $t: jest.fn((t) => t),
    $apollo: {
      mutate: updateUserInfosMutationMock,
    },
  }

  const Wrapper = () => {
    return mount(LanguageSwitch, { localVue, mocks })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the component', () => {
      expect(wrapper.find('div.language-switch').exists()).toBe(true)
    })

    describe('with locales en and de', () => {
      describe('empty store', () => {
        describe('navigator language is "en-US"', () => {
          const languageGetter = jest.spyOn(navigator, 'language', 'get')
          it('shows English as default navigator langauge', async () => {
            languageGetter.mockReturnValue('en-US')
            wrapper.vm.setCurrentLanguage()
            await wrapper.vm.$nextTick()
            expect(wrapper.findAll('span.locales').at(0).text()).toBe('English')
          })
        })
        describe('navigator language is "de-DE"', () => {
          const languageGetter = jest.spyOn(navigator, 'language', 'get')
          it('shows Deutsch as language ', async () => {
            languageGetter.mockReturnValue('de-DE')
            wrapper.vm.setCurrentLanguage()
            await wrapper.vm.$nextTick()
            expect(wrapper.findAll('span.locales').at(1).text()).toBe('Deutsch')
          })
        })
        describe('navigator language is "es-ES"', () => {
          const languageGetter = jest.spyOn(navigator, 'language', 'get')
          it('shows Español as language ', async () => {
            languageGetter.mockReturnValue('es-ES')
            wrapper.vm.setCurrentLanguage()
            await wrapper.vm.$nextTick()
            expect(wrapper.findAll('span.locales').at(2).text()).toBe('Español')
          })
        })
        describe('navigator language is "fr-FR"', () => {
          const languageGetter = jest.spyOn(navigator, 'language', 'get')
          it('shows French as language ', async () => {
            languageGetter.mockReturnValue('fr-FR')
            wrapper.vm.setCurrentLanguage()
            await wrapper.vm.$nextTick()
            expect(wrapper.findAll('span.locales').at(3).text()).toBe('French')
          })
        })
        describe('navigator language is "nl-NL"', () => {
          const languageGetter = jest.spyOn(navigator, 'language', 'get')
          it('shows Dutch as language ', async () => {
            languageGetter.mockReturnValue('nl-NL')
            wrapper.vm.setCurrentLanguage()
            await wrapper.vm.$nextTick()
            expect(wrapper.findAll('span.locales').at(4).text()).toBe('Dutch')
          })
        })
        describe('navigator language is "it-IT" (not supported)', () => {
          const languageGetter = jest.spyOn(navigator, 'language', 'get')
          it('shows English as language ', async () => {
            languageGetter.mockReturnValue('it-IT')
            wrapper.vm.setCurrentLanguage()
            await wrapper.vm.$nextTick()
            expect(wrapper.findAll('span.locales').at(0).text()).toBe('English')
          })
        })
        describe('no navigator langauge', () => {
          const languageGetter = jest.spyOn(navigator, 'language', 'get')
          it('shows English as language ', async () => {
            languageGetter.mockReturnValue(null)
            wrapper.vm.setCurrentLanguage()
            await wrapper.vm.$nextTick()
            expect(wrapper.findAll('span.locales').at(0).text()).toBe('English')
          })
        })
      })
      describe('language "de" in store', () => {
        it('shows Deutsch as language', async () => {
          wrapper.vm.$store.state.language = 'de'
          wrapper.vm.setCurrentLanguage()
          await wrapper.vm.$nextTick()
          expect(wrapper.findAll('span.locales').at(1).text()).toBe('Deutsch')
        })
      })
      describe('language "es" in store', () => {
        it('shows Español as language', async () => {
          wrapper.vm.$store.state.language = 'es'
          wrapper.vm.setCurrentLanguage()
          await wrapper.vm.$nextTick()
          expect(wrapper.findAll('span.locales').at(2).text()).toBe('Español')
        })
      })
      describe('language "fr" in store', () => {
        it('shows French as language', async () => {
          wrapper.vm.$store.state.language = 'fr'
          wrapper.vm.setCurrentLanguage()
          await wrapper.vm.$nextTick()
          expect(wrapper.findAll('span.locales').at(3).text()).toBe('French')
        })
      })
      describe('language "nl" in store', () => {
        it('shows Dutch as language', async () => {
          wrapper.vm.$store.state.language = 'nl'
          wrapper.vm.setCurrentLanguage()
          await wrapper.vm.$nextTick()
          expect(wrapper.findAll('span.locales').at(4).text()).toBe('Dutch')
        })
      })
      describe('language menu', () => {
        it('has English, German and Español as languages to choose', () => {
          expect(wrapper.findAll('span.locales')).toHaveLength(5)
        })
        it('has English as first language to choose', () => {
          expect(wrapper.findAll('span.locales').at(0).text()).toBe('English')
        })
        it('has German as second language to choose', () => {
          expect(wrapper.findAll('span.locales').at(1).text()).toBe('Deutsch')
        })
        it('has Español as third language to choose', () => {
          expect(wrapper.findAll('span.locales').at(2).text()).toBe('Español')
        })
        it('has French as third language to choose', () => {
          expect(wrapper.findAll('span.locales').at(3).text()).toBe('French')
        })
        it('has Dutch as third language to choose', () => {
          expect(wrapper.findAll('span.locales').at(4).text()).toBe('Dutch')
        })
      })
    })

    describe('calls the API', () => {
      it("with locale 'de'", () => {
        wrapper.findAll('span.locales').at(1).trigger('click')
        expect(updateUserInfosMutationMock).toBeCalledWith(
          expect.objectContaining({
            variables: {
              locale: 'de',
            },
          }),
        )
      })
    })
  })
})
