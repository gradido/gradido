import { mount } from '@vue/test-utils'
import LanguageSwitch from './LanguageSwitch'

const localVue = global.localVue

describe('LanguageSwitch', () => {
  let wrapper

  const state = {
    sessionId: 1234,
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

    describe('with locales en and de', () => {
      describe('empty store', () => {
        it('shows English as default navigator langauge', () => {
          expect(wrapper.find('button.dropdown-toggle').text()).toBe('English - en')
        })

        describe('navigator language is "de-DE"', () => {
          const mockNavigator = jest.fn(() => {
            return 'de'
          })

          it('shows Deutsch as language ', async () => {
            wrapper.vm.getNavigatorLanguage = mockNavigator
            wrapper.vm.setCurrentLanguage()
            await wrapper.vm.$nextTick()
            expect(wrapper.find('button.dropdown-toggle').text()).toBe('Deutsch - de')
          })
        })

        describe('navigator language is "es-ES" (not supported)', () => {
          const mockNavigator = jest.fn(() => {
            return 'es'
          })

          it('shows English as language ', async () => {
            wrapper.vm.getNavigatorLanguage = mockNavigator
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

      describe('dropdown menu', () => {
        it('has English and German as languages to choose', () => {
          expect(wrapper.findAll('li')).toHaveLength(2)
        })

        it('has English as first language to choose', () => {
          expect(wrapper.findAll('li').at(0).text()).toBe('English')
        })

        it('has German as second language to choose', () => {
          expect(wrapper.findAll('li').at(1).text()).toBe('Deutsch')
        })
      })
    })
  })
})
