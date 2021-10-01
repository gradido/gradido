import { mount } from '@vue/test-utils'
import UserCardLanguage from './UserCard_Language'

const localVue = global.localVue

const mockAPIcall = jest.fn().mockResolvedValue({
  data: {
    updateUserInfos: {
      validValues: 1,
    },
  },
})

const toastErrorMock = jest.fn()
const toastSuccessMock = jest.fn()
const storeCommitMock = jest.fn()

describe('UserCard_Language', () => {
  let wrapper

  const mocks = {
    $t: jest.fn((t) => t),
    $store: {
      state: {
        language: 'de',
        email: 'peter@lustig.de',
      },
      commit: storeCommitMock,
    },
    $toasted: {
      success: toastSuccessMock,
      error: toastErrorMock,
    },
    $apollo: {
      mutate: mockAPIcall,
    },
    $i18n: {
      locale: 'de',
    },
  }

  const Wrapper = () => {
    return mount(UserCardLanguage, { localVue, mocks })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the component', () => {
      expect(wrapper.find('div#formuserlanguage').exists()).toBeTruthy()
    })

    it('has an edit icon', () => {
      expect(wrapper.find('svg.bi-pencil').exists()).toBeTruthy()
    })

    it('has change language as text', () => {
      expect(wrapper.find('a').text()).toBe('settings.language.changeLanguage')
    })

    it('has no select field by default', () => {
      expect(wrapper.find('select').exists()).toBeFalsy()
    })

    describe('edit button', () => {
      beforeEach(() => {
        wrapper.find('a').trigger('click')
      })

      it('has no edit icon anymore', () => {
        expect(wrapper.find('svg.bi-pencil').exists()).toBeFalsy()
      })

      it('has x-circle icon', () => {
        expect(wrapper.find('svg.bi-x-circle').exists()).toBeTruthy()
      })

      it('has a submit button', () => {
        expect(wrapper.find('button[type="submit"]').exists()).toBeTruthy()
      })

      it('has the submit button disbaled by default', () => {
        expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBe('disabled')
      })

      describe('change language', () => {
        it('does not enable the submit button when same language is chosen', () => {
          wrapper.findAll('option').at(0).setSelected()
          expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBe('disabled')
        })

        it('enables the submit button when other language is chosen', async () => {
          await wrapper.findAll('option').at(1).setSelected()
          expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBe(undefined)
        })

        it('updates language data in component', async () => {
          await wrapper.findAll('option').at(1).setSelected()
          expect(wrapper.vm.language).toBe('en')
        })

        describe('cancel edit', () => {
          beforeEach(async () => {
            await wrapper.findAll('option').at(1).setSelected()
            wrapper.find('a').trigger('click')
          })

          it('sets the language to initial value', () => {
            expect(wrapper.vm.language).toBe('de')
          })

          it('has no select field anymore', () => {
            expect(wrapper.find('select').exists()).toBeFalsy()
          })
        })

        describe('submit', () => {
          beforeEach(async () => {
            await wrapper.findAll('option').at(1).setSelected()
            wrapper.find('form').trigger('submit')
          })

          describe('with success', () => {
            it('calls the API', () => {
              expect(mockAPIcall).toBeCalledWith(
                expect.objectContaining({
                  variables: {
                    email: 'peter@lustig.de',
                    locale: 'en',
                  },
                }),
              )
            })

            it('commits new language to store', () => {
              expect(storeCommitMock).toBeCalledWith('language', 'en')
            })

            it('changes the i18n locale', () => {
              expect(mocks.$i18n.locale).toBe('en')
            })

            it('has no select field anymore', () => {
              expect(wrapper.find('select').exists()).toBeFalsy()
            })

            it('toasts a success message', () => {
              expect(toastSuccessMock).toBeCalledWith('settings.language.success')
            })
          })

          describe('with error', () => {
            beforeEach(() => {
              mockAPIcall.mockRejectedValue({
                message: 'Ouch!',
              })
            })

            it('sets the language back to initial value', () => {
              expect(wrapper.vm.language).toBe('de')
            })

            it('toasts an error message', () => {
              expect(toastErrorMock).toBeCalledWith('Ouch!')
            })
          })
        })
      })
    })
  })
})
