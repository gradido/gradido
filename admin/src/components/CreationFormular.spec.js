import { mount } from '@vue/test-utils'
import CreationFormular from './CreationFormular.vue'
import { createPendingCreation } from '../graphql/createPendingCreation'
import { createPendingCreations } from '../graphql/createPendingCreations'
import { toastErrorSpy, toastSuccessSpy } from '../../test/testSetup'

const localVue = global.localVue

const apolloMutateMock = jest.fn().mockResolvedValue({
  data: {
    createPendingCreation: [0, 0, 0],
  },
})
const stateCommitMock = jest.fn()

const mocks = {
  $t: jest.fn((t, options) => (options ? [t, options] : t)),
  $d: jest.fn((d) => {
    const date = new Date(d)
    return date.toISOString().split('T')[0]
  }),
  $apollo: {
    mutate: apolloMutateMock,
  },
  $store: {
    commit: stateCommitMock,
    state: {
      moderator: {
        id: 0,
        name: 'test moderator',
      },
    },
  },
}

const propsData = {
  type: '',
  creation: [],
}

const now = new Date(Date.now())
const getCreationDate = (sub) => {
  const date = sub === 0 ? now : new Date(now.getFullYear(), now.getMonth() - sub, 1, 0)
  return date.toISOString().split('T')[0]
}

describe('CreationFormular', () => {
  let wrapper

  const Wrapper = () => {
    return mount(CreationFormular, { localVue, mocks, propsData })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('has a DIV element with the class.component-creation-formular', () => {
      expect(wrapper.find('.component-creation-formular').exists()).toBeTruthy()
    })

    describe('text and value form props', () => {
      beforeEach(async () => {
        wrapper = mount(CreationFormular, {
          localVue,
          mocks,
          propsData: {
            creationUserData: { memo: 'Memo from property', amount: 42 },
            ...propsData,
          },
        })
      })

      it('has text taken from props', () => {
        expect(wrapper.vm.text).toBe('Memo from property')
      })

      it('has value taken from props', () => {
        expect(wrapper.vm.value).toBe(42)
      })
    })

    describe('radio buttons to selcet month', () => {
      it('has three radio buttons', () => {
        expect(wrapper.findAll('input[type="radio"]').length).toBe(3)
      })

      describe('with single creation', () => {
        beforeEach(async () => {
          jest.clearAllMocks()
          await wrapper.setProps({
            type: 'singleCreation',
            creation: [200, 400, 600],
            item: { email: 'benjamin@bluemchen.de' },
          })
          await wrapper.findAll('input[type="radio"]').at(1).setChecked()
          await wrapper.find('input[type="number"]').setValue(90)
        })

        describe('first radio button', () => {
          beforeEach(async () => {
            await wrapper.findAll('input[type="radio"]').at(0).setChecked()
            await wrapper.find('textarea').setValue('Test create coins')
          })

          it('sets rangeMax to 200', () => {
            expect(wrapper.vm.rangeMax).toBe(200)
          })

          describe('sendForm', () => {
            beforeEach(async () => {
              await wrapper.find('.test-submit').trigger('click')
            })

            it('sends ... to apollo', () => {
              expect(apolloMutateMock).toBeCalledWith(
                expect.objectContaining({
                  mutation: createPendingCreation,
                  variables: {
                    email: 'benjamin@bluemchen.de',
                    creationDate: getCreationDate(2),
                    amount: 90,
                    memo: 'Test create coins',
                    moderator: 0,
                  },
                }),
              )
            })

            it('emits update-user-data', () => {
              expect(wrapper.emitted('update-user-data')).toEqual([
                [{ email: 'benjamin@bluemchen.de' }, [0, 0, 0]],
              ])
            })

            it('toasts a success message', () => {
              expect(toastSuccessSpy).toBeCalledWith([
                'creation_form.toasted',
                { email: 'benjamin@bluemchen.de', value: '90' },
              ])
            })

            it('updates open creations in store', () => {
              expect(stateCommitMock).toBeCalledWith('openCreationsPlus', 1)
            })

            it('resets the form data', () => {
              expect(wrapper.vm.value).toBe(0)
            })
          })

          describe('sendForm with server error', () => {
            beforeEach(async () => {
              apolloMutateMock.mockRejectedValueOnce({ message: 'Ouch!' })
              await wrapper.find('.test-submit').trigger('click')
            })

            it('toasts an error message', () => {
              expect(toastErrorSpy).toBeCalledWith('Ouch!')
            })
          })

          describe('Negativ value', () => {
            beforeEach(async () => {
              jest.clearAllMocks()
              await wrapper.setProps({ type: 'singleCreation', creation: [200, 400, 600] })
              await wrapper.setData({ rangeMin: 180 })
              await wrapper.setData({ value: -20 })
            })

            it('has no submit button', async () => {
              expect(await wrapper.find('.test-submit').attributes('disabled')).toBe('disabled')
            })
          })

          describe('Empty text', () => {
            beforeEach(async () => {
              jest.clearAllMocks()
              await wrapper.setProps({ type: 'singleCreation', creation: [200, 400, 600] })
              await wrapper.setData({ rangeMin: 180 })
              await wrapper.setData({ text: '' })
            })

            it('has no submit button', async () => {
              expect(await wrapper.find('.test-submit').attributes('disabled')).toBe('disabled')
            })
          })

          describe('Text length less than 10', () => {
            beforeEach(async () => {
              jest.clearAllMocks()
              await wrapper.setProps({ type: 'singleCreation', creation: [200, 400, 600] })
              await wrapper.setData({ rangeMin: 180 })
              await wrapper.setData({ text: 'Try this' })
            })

            it('has no submit button', async () => {
              expect(await wrapper.find('.test-submit').attributes('disabled')).toBe('disabled')
            })
          })
        })

        describe('second radio button', () => {
          beforeEach(async () => {
            await wrapper.findAll('input[type="radio"]').at(1).setChecked()
          })

          it('sets rangeMin to 0', () => {
            expect(wrapper.vm.rangeMin).toBe(0)
          })

          it('sets rangeMax to 400', () => {
            expect(wrapper.vm.rangeMax).toBe(400)
          })

          describe('sendForm', () => {
            beforeEach(async () => {
              await wrapper.find('.test-submit').trigger('click')
            })

            it('sends ... to apollo', () => {
              expect(apolloMutateMock).toBeCalled()
            })
          })

          describe('Negativ value', () => {
            beforeEach(async () => {
              jest.clearAllMocks()
              await wrapper.setProps({ type: 'singleCreation', creation: [200, 400, 600] })
              await wrapper.setData({ rangeMin: 180 })
              await wrapper.setData({ value: -20 })
            })

            it('has no submit button', async () => {
              expect(await wrapper.find('.test-submit').attributes('disabled')).toBe('disabled')
            })
          })

          describe('Empty text', () => {
            beforeEach(async () => {
              jest.clearAllMocks()
              await wrapper.setProps({ type: 'singleCreation', creation: [200, 400, 600] })
              await wrapper.setData({ rangeMin: 180 })
              await wrapper.setData({ text: '' })
            })

            it('has no submit button', async () => {
              expect(await wrapper.find('.test-submit').attributes('disabled')).toBe('disabled')
            })
          })

          describe('Text length less than 10', () => {
            beforeEach(async () => {
              jest.clearAllMocks()
              await wrapper.setProps({ type: 'singleCreation', creation: [200, 400, 600] })
              await wrapper.setData({ rangeMin: 180 })
              await wrapper.setData({ text: 'Try this' })
            })

            it('has no submit button', async () => {
              expect(await wrapper.find('.test-submit').attributes('disabled')).toBe('disabled')
            })
          })
        })

        describe('third radio button', () => {
          beforeEach(async () => {
            await wrapper.findAll('input[type="radio"]').at(2).setChecked()
          })

          it('sets rangeMin to 0', () => {
            expect(wrapper.vm.rangeMin).toBe(0)
          })

          it('sets rangeMax to 400', () => {
            expect(wrapper.vm.rangeMax).toBe(600)
          })

          describe('sendForm', () => {
            beforeEach(async () => {
              await wrapper.find('.test-submit').trigger('click')
            })

            it('sends mutation to apollo', () => {
              expect(apolloMutateMock).toBeCalled()
            })

            it('toast success message', () => {
              expect(toastSuccessSpy).toBeCalled()
            })

            it('store commit openCreationPlus', () => {
              expect(stateCommitMock).toBeCalledWith('openCreationsPlus', 1)
            })
          })

          describe('Negativ value', () => {
            beforeEach(async () => {
              jest.clearAllMocks()
              await wrapper.setProps({ type: 'singleCreation', creation: [200, 400, 600] })
              await wrapper.setData({ rangeMin: 180 })
              await wrapper.setData({ value: -20 })
            })

            it('has no submit button', async () => {
              expect(await wrapper.find('.test-submit').attributes('disabled')).toBe('disabled')
            })
          })

          describe('Empty text', () => {
            beforeEach(async () => {
              jest.clearAllMocks()
              await wrapper.setProps({ type: 'singleCreation', creation: [200, 400, 600] })
              await wrapper.setData({ rangeMin: 180 })
              await wrapper.setData({ text: '' })
            })

            it('has no submit button', async () => {
              expect(await wrapper.find('.test-submit').attributes('disabled')).toBe('disabled')
            })
          })

          describe('Text length less than 10', () => {
            beforeEach(async () => {
              jest.clearAllMocks()
              await wrapper.setProps({ type: 'singleCreation', creation: [200, 400, 600] })
              await wrapper.setData({ rangeMin: 180 })
              await wrapper.setData({ text: 'Try this' })
            })

            it('has no submit button', async () => {
              expect(await wrapper.find('.test-submit').attributes('disabled')).toBe('disabled')
            })
          })
        })
      })

      describe('mass creation with success', () => {
        beforeEach(async () => {
          jest.clearAllMocks()
          apolloMutateMock.mockResolvedValue({
            data: {
              createPendingCreations: {
                success: true,
                successfulCreation: ['bob@baumeister.de', 'bibi@bloxberg.de'],
                failedCreation: [],
              },
            },
          })
          await wrapper.setProps({
            type: 'massCreation',
            creation: [200, 400, 600],
            items: [{ email: 'bob@baumeister.de' }, { email: 'bibi@bloxberg.de' }],
          })
          await wrapper.findAll('input[type="radio"]').at(1).setChecked()
          await wrapper.find('textarea').setValue('Test mass create coins')
          await wrapper.find('input[type="number"]').setValue(200)
          await wrapper.find('.test-submit').trigger('click')
        })

        it('calls the API', () => {
          expect(apolloMutateMock).toBeCalledWith(
            expect.objectContaining({
              mutation: createPendingCreations,
              variables: {
                pendingCreations: [
                  {
                    email: 'bob@baumeister.de',
                    creationDate: getCreationDate(1),
                    amount: 200,
                    memo: 'Test mass create coins',
                    moderator: 0,
                  },
                  {
                    email: 'bibi@bloxberg.de',
                    creationDate: getCreationDate(1),
                    amount: 200,
                    memo: 'Test mass create coins',
                    moderator: 0,
                  },
                ],
              },
            }),
          )
        })

        it('updates open creations in store', () => {
          expect(stateCommitMock).toBeCalledWith('openCreationsPlus', 2)
        })

        it('emits remove-all-bookmark', () => {
          expect(wrapper.emitted('remove-all-bookmark')).toBeTruthy()
        })
      })

      describe('mass creation with success but all failed', () => {
        beforeEach(async () => {
          jest.clearAllMocks()
          apolloMutateMock.mockResolvedValue({
            data: {
              createPendingCreations: {
                success: true,
                successfulCreation: [],
                failedCreation: ['bob@baumeister.de', 'bibi@bloxberg.de'],
              },
            },
          })
          await wrapper.setProps({
            type: 'massCreation',
            creation: [200, 400, 600],
            items: [{ email: 'bob@baumeister.de' }, { email: 'bibi@bloxberg.de' }],
          })
          await wrapper.findAll('input[type="radio"]').at(1).setChecked()
          await wrapper.find('textarea').setValue('Test mass create coins')
          await wrapper.find('input[type="number"]').setValue(200)
          await wrapper.find('.test-submit').trigger('click')
        })

        it('updates open creations in store', () => {
          expect(stateCommitMock).toBeCalledWith('openCreationsPlus', 0)
        })

        it('emits remove all bookmarks', () => {
          expect(wrapper.emitted('remove-all-bookmark')).toBeTruthy()
        })

        it('emits toast failed creations with two emails', () => {
          expect(wrapper.emitted('toast-failed-creations')).toEqual([
            [['bob@baumeister.de', 'bibi@bloxberg.de']],
          ])
        })
      })

      describe('mass creation with error', () => {
        beforeEach(async () => {
          jest.clearAllMocks()
          apolloMutateMock.mockRejectedValue({
            message: 'Oh no!',
          })
          await wrapper.setProps({
            type: 'massCreation',
            creation: [200, 400, 600],
            items: [{ email: 'bob@baumeister.de' }, { email: 'bibi@bloxberg.de' }],
          })
          await wrapper.findAll('input[type="radio"]').at(1).setChecked()
          await wrapper.find('textarea').setValue('Test mass create coins')
          await wrapper.find('input[type="number"]').setValue(200)
          await wrapper.find('.test-submit').trigger('click')
        })

        it('toasts an error message', () => {
          expect(toastErrorSpy).toBeCalledWith('Oh no!')
        })
      })
    })
  })
})
