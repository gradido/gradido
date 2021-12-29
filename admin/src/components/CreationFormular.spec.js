import { mount } from '@vue/test-utils'
import CreationFormular from './CreationFormular.vue'

const localVue = global.localVue

const apolloMock = jest.fn().mockResolvedValue({
  data: {
    verifyLogin: {
      name: 'success',
      id: 0,
    },
  },
})
const apolloMutateMock = jest.fn().mockResolvedValue({
  data: {
    createPendingCreation: [0, 0, 0],
  },
})
const stateCommitMock = jest.fn()
const toastedErrorMock = jest.fn()
const toastedSuccessMock = jest.fn()

const mocks = {
  $t: jest.fn((t) => t),
  $moment: jest.fn(() => {
    return {
      format: jest.fn((m) => m),
      subtract: jest.fn(() => {
        return {
          format: jest.fn((m) => m),
        }
      }),
    }
  }),
  $apollo: {
    query: apolloMock,
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
  $toasted: {
    error: toastedErrorMock,
    success: toastedSuccessMock,
  },
}

const propsData = {
  type: '',
  creation: [],
  itemsMassCreation: {},
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

    describe('server sends back moderator data', () => {
      it('called store commit with mocked data', () => {
        expect(stateCommitMock).toBeCalledWith('moderator', { name: 'success', id: 0 })
      })
    })

    describe('server throws error for moderator data call', () => {
      beforeEach(() => {
        jest.clearAllMocks()
        apolloMock.mockRejectedValueOnce({ message: 'Ouch!' })
        wrapper = Wrapper()
      })

      it('has called store commit with fake data', () => {
        expect(stateCommitMock).toBeCalledWith('moderator', { id: 0, name: 'Test Moderator' })
      })
    })

    describe('radio buttons to selcet month', () => {
      it('has three radio buttons', () => {
        expect(wrapper.findAll('input[type="radio"]').length).toBe(3)
      })

      describe('with mass creation', () => {
        beforeEach(async () => {
          jest.clearAllMocks()
          await wrapper.setProps({ type: 'massCreation' })
        })

        describe('first radio button', () => {
          beforeEach(async () => {
            await wrapper.findAll('input[type="radio"]').at(0).setChecked()
          })

          it('emits update-radio-selected with index 0', () => {
            expect(wrapper.emitted()['update-radio-selected']).toEqual([
              [expect.arrayContaining([0])],
            ])
          })
        })

        describe('second radio button', () => {
          beforeEach(async () => {
            await wrapper.findAll('input[type="radio"]').at(1).setChecked()
          })

          it('emits update-radio-selected with index 1', () => {
            expect(wrapper.emitted()['update-radio-selected']).toEqual([
              [expect.arrayContaining([1])],
            ])
          })
        })

        describe('third radio button', () => {
          beforeEach(async () => {
            await wrapper.findAll('input[type="radio"]').at(2).setChecked()
          })

          it('emits update-radio-selected with index 2', () => {
            expect(wrapper.emitted()['update-radio-selected']).toEqual([
              [expect.arrayContaining([2])],
            ])
          })
        })
      })

      describe('with single creation', () => {
        beforeEach(async () => {
          jest.clearAllMocks()
          await wrapper.setProps({ type: 'singleCreation', creation: [200, 400, 600] })
          await wrapper.setData({ rangeMin: 180 })
          await wrapper.setData({ text: 'Test create coins' })
          await wrapper.setData({ value: 90 })
        })

        describe('first radio button', () => {
          beforeEach(async () => {
            await wrapper.findAll('input[type="radio"]').at(0).setChecked()
          })

          it('sets rangeMin to 0', () => {
            expect(wrapper.vm.rangeMin).toBe(0)
          })

          it('sets rangeMax to 200', () => {
            expect(wrapper.vm.rangeMax).toBe(200)
          })

          describe('sendForm', () => {
            beforeEach(async () => {
              await wrapper.find('.test-submit').trigger('click')
            })

            it('sends ... to apollo', () => {
              expect(apolloMutateMock).toBeCalled()
            })
          })

          describe('sendForm', () => {
            beforeEach(async () => {
              apolloMutateMock.mockRejectedValueOnce({ message: 'Ouch!' })
              await wrapper.find('.test-submit').trigger('click')
            })

            it('toasts an error message', () => {
              expect(toastedErrorMock).toBeCalledWith('Ouch!')
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
              expect(toastedSuccessMock).toBeCalled()
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
    })
  })
})
