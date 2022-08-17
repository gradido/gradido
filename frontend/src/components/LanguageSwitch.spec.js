import { mount } from '@vue/test-utils'
import LanguageSwitch from './LanguageSwitch'

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
      expect(wrapper.find('div.language-switch').exists()).toBeTruthy()
    })

    describe('with locales en, de and es', () => {
      describe('empty store', () => {
        describe('navigator language is "en-US"', () => {
          const languageGetter = jest.spyOn(navigator, 'language', 'get')

          it('shows English as default navigator langauge', async () => {
            languageGetter.mockReturnValue('en-US')
            wrapper.vm.setCurrentLanguage()
            await wrapper.vm.$nextTick()
            expect(wrapper.find('button.dropdown-toggle').text()).toBe('English - en')
          })
        })

        describe('navigator language is "de-DE"', () => {
          const languageGetter = jest.spyOn(navigator, 'language', 'get')

          it('shows Deutsch as language ', async () => {
            languageGetter.mockReturnValue('de-DE')
            wrapper.vm.setCurrentLanguage()
            await wrapper.vm.$nextTick()
            expect(wrapper.find('button.dropdown-toggle').text()).toBe('Deutsch - de')
          })
        })

        describe('navigator language is "es-ES"', () => {
          const languageGetter = jest.spyOn(navigator, 'language', 'get')

          it('shows Español as language ', async () => {
            languageGetter.mockReturnValue('es-ES')
            wrapper.vm.setCurrentLanguage()
            await wrapper.vm.$nextTick()
            expect(wrapper.find('button.dropdown-toggle').text()).toBe('Español - es')
          })
        })

        describe('navigator language is "fr-FR"', () => {
          const languageGetter = jest.spyOn(navigator, 'language', 'get')

          it('shows French as language ', async () => {
            languageGetter.mockReturnValue('fr-FR')
            wrapper.vm.setCurrentLanguage()
            await wrapper.vm.$nextTick()
            expect(wrapper.find('button.dropdown-toggle').text()).toBe('Français - fr')
          })
        })

        describe('navigator language is "nl-NL"', () => {
          const languageGetter = jest.spyOn(navigator, 'language', 'get')

          it('shows Dutch as language ', async () => {
            languageGetter.mockReturnValue('nl-NL')
            wrapper.vm.setCurrentLanguage()
            await wrapper.vm.$nextTick()
            expect(wrapper.find('button.dropdown-toggle').text()).toBe('Holandés - nl')
          })
        })

        describe('navigator language is "it-IT" (not supported)', () => {
          const languageGetter = jest.spyOn(navigator, 'language', 'get')

          it('shows English as language ', async () => {
            languageGetter.mockReturnValue('it-IT')
            wrapper.vm.setCurrentLanguage()
            await wrapper.vm.$nextTick()
            expect(wrapper.find('button.dropdown-toggle').text()).toBe('English - en')
          })
        })

        describe('no navigator langauge', () => {
          const languageGetter = jest.spyOn(navigator, 'language', 'get')

          it('shows English as language ', async () => {
            languageGetter.mockReturnValue(null)
            wrapper.vm.setCurrentLanguage()
            await wrapper.vm.$nextTick()
            expect(wrapper.find('button.dropdown-toggle').text()).toBe('English - en')
          })
        })
      })

      describe('language "de" in store', () => {
        it('shows Deutsch as language', async () => {
          wrapper.vm.$store.state.language = 'de'
          wrapper.vm.setCurrentLanguage()
          await wrapper.vm.$nextTick()
          expect(wrapper.find('button.dropdown-toggle').text()).toBe('Deutsch - de')
        })
      })

      describe('language "es" in store', () => {
        it('shows Español as language', async () => {
          wrapper.vm.$store.state.language = 'es'
          wrapper.vm.setCurrentLanguage()
          await wrapper.vm.$nextTick()
          expect(wrapper.find('button.dropdown-toggle').text()).toBe('Español - es')
        })
      })

      describe('language "fr" in store', () => {
        it('shows French as language', async () => {
          wrapper.vm.$store.state.language = 'fr'
          wrapper.vm.setCurrentLanguage()
          await wrapper.vm.$nextTick()
          expect(wrapper.find('button.dropdown-toggle').text()).toBe('Français - fr')
        })
      })

      describe('language "nl" in store', () => {
        it('shows Dutch as language', async () => {
          wrapper.vm.$store.state.language = 'nl'
          wrapper.vm.setCurrentLanguage()
          await wrapper.vm.$nextTick()
          expect(wrapper.find('button.dropdown-toggle').text()).toBe('Holandés - nl')
        })
      })

      describe('dropdown menu', () => {
        it('has English and German as languages to choose', () => {
          expect(wrapper.findAll('li')).toHaveLength(5)
        })

        it('has English as first language to choose', () => {
          expect(wrapper.findAll('li').at(0).text()).toBe('English')
        })

        it('has German as second language to choose', () => {
          expect(wrapper.findAll('li').at(1).text()).toBe('Deutsch')
        })

        it('has Español as second language to choose', () => {
          expect(wrapper.findAll('li').at(2).text()).toBe('Español')
        })

        it('has French as second language to choose', () => {
          expect(wrapper.findAll('li').at(3).text()).toBe('Français')
        })

        it('has Dutch as second language to choose', () => {
          expect(wrapper.findAll('li').at(4).text()).toBe('Holandés')
        })
      })
    })

    describe('calls the API', () => {
      it("with locale 'en'", () => {
        wrapper.findAll('li').at(0).find('a').trigger('click')
        expect(updateUserInfosMutationMock).toBeCalledWith(
          expect.objectContaining({
            variables: {
              locale: 'en',
            },
          }),
        )
      })

      it("with locale 'de'", () => {
        wrapper.findAll('li').at(1).find('a').trigger('click')
        expect(updateUserInfosMutationMock).toBeCalledWith(
          expect.objectContaining({
            variables: {
              locale: 'de',
            },
          }),
        )
      })

      it("with locale 'es'", () => {
        wrapper.findAll('li').at(2).find('a').trigger('click')
        expect(updateUserInfosMutationMock).toBeCalledWith(
          expect.objectContaining({
            variables: {
              locale: 'es',
            },
          }),
        )
      })

      it("with locale 'fr'", () => {
        wrapper.findAll('li').at(3).find('a').trigger('click')
        expect(updateUserInfosMutationMock).toBeCalledWith(
          expect.objectContaining({
            variables: {
              locale: 'fr',
            },
          }),
        )
      })

      it("with locale 'nl'", () => {
        wrapper.findAll('li').at(4).find('a').trigger('click')
        expect(updateUserInfosMutationMock).toBeCalledWith(
          expect.objectContaining({
            variables: {
              locale: 'nl',
            },
          }),
        )
      })
    })
  })
})
