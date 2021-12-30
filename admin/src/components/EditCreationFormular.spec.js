import { mount } from '@vue/test-utils'
import EditCreationFormular from './EditCreationFormular.vue'

const localVue = global.localVue

const apolloMutateMock = jest.fn().mockResolvedValue({
  data: {
    updatePendingCreation: {
      creation: [0, 0, 0],
      date: new Date(),
      memo: 'qwertzuiopasdfghjkl',
      moderator: 0,
    },
  },
})

const stateCommitMock = jest.fn()
const toastedErrorMock = jest.fn()

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
    mutate: apolloMutateMock,
  },
  $store: {
    state: {
      moderator: {
        id: 0,
        name: 'test moderator',
      },
    },
    commit: stateCommitMock,
  },
  $toasted: {
    error: toastedErrorMock,
  },
}

const propsData = {
  creation: [200, 400, 600],
  creationUserData: {
    memo: 'Test schöpfung 1',
    amount: 100,
    date: '2021-12-01',
  },
}

describe('EditCreationFormular', () => {
  let wrapper

  const Wrapper = () => {
    return mount(EditCreationFormular, { localVue, mocks, propsData })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('has a DIV element with the class.component-edit-creation-formular', () => {
      expect(wrapper.find('.component-edit-creation-formular').exists()).toBeTruthy()
    })

    describe('radio buttons to select month', () => {
      it('has three radio buttons', () => {
        expect(wrapper.findAll('input[type="radio"]').length).toBe(3)
      })

      describe('with single creation', () => {
        beforeEach(async () => {
          jest.clearAllMocks()
          await wrapper.setProps({ creation: [200, 400, 600] })
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
              expect(apolloMutateMock).toBeCalledWith(
                expect.objectContaining({
                  variables: {
                    amount: 90,
                    creationDate: 'YYYY-MM-01',
                    email: undefined,
                    id: undefined,
                    memo: 'Test create coins',
                    moderator: 0,
                  },
                }),
              )
            })

            describe('sendForm with error', () => {
              beforeEach(async () => {
                jest.clearAllMocks()
                apolloMutateMock.mockRejectedValue({
                  message: 'Ouch!',
                })
                wrapper = Wrapper()
                await wrapper.setProps({ type: 'singleCreation', creation: [200, 400, 600] })
                await wrapper.setData({ text: 'Test create coins' })
                await wrapper.setData({ value: 90 })
                await wrapper.findAll('input[type="radio"]').at(0).setChecked()
                await wrapper.setData({ rangeMin: 100 })
                await wrapper.find('.test-submit').trigger('click')
              })

              it('toast error message', () => {
                expect(toastedErrorMock).toBeCalledWith('Ouch!')
              })
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
              expect(apolloMutateMock).toBeCalledWith(
                expect.objectContaining({
                  variables: {
                    amount: 90,
                    creationDate: 'YYYY-MM-01',
                    email: undefined,
                    id: undefined,
                    memo: 'Test create coins',
                    moderator: 0,
                  },
                }),
              )
            })

            describe('sendForm with error', () => {
              beforeEach(async () => {
                jest.clearAllMocks()
                apolloMutateMock.mockRejectedValue({
                  message: 'Ouch!',
                })
                wrapper = Wrapper()
                await wrapper.setProps({ creation: [200, 400, 600] })
                await wrapper.setData({ text: 'Test create coins' })
                await wrapper.setData({ value: 100 })
                await wrapper.findAll('input[type="radio"]').at(1).setChecked()
                await wrapper.setData({ rangeMin: 180 })
                await wrapper.find('.test-submit').trigger('click')
              })

              it('toast error message', () => {
                expect(toastedErrorMock).toBeCalledWith('Ouch!')
              })
            })
          })
        })

        describe('third radio button', () => {
          beforeEach(async () => {
            await wrapper.setData({ rangeMin: 180 })
            await wrapper.findAll('input[type="radio"]').at(2).setChecked()
          })

          it('sets rangeMin to 180', () => {
            expect(wrapper.vm.rangeMin).toBe(180)
          })

          it('sets rangeMax to 700', () => {
            expect(wrapper.vm.rangeMax).toBe(700)
          })

          describe('sendForm with success', () => {
            beforeEach(async () => {
              await wrapper.find('.test-submit').trigger('click')
            })

            it('sends ... to apollo', () => {
              expect(apolloMutateMock).toBeCalledWith(
                expect.objectContaining({
                  variables: {
                    amount: 90,
                    creationDate: 'YYYY-MM-DD',
                    email: undefined,
                    id: undefined,
                    memo: 'Test create coins',
                    moderator: 0,
                  },
                }),
              )
            })
          })

          describe('sendForm with error', () => {
            beforeEach(async () => {
              jest.clearAllMocks()
              apolloMutateMock.mockRejectedValue({
                message: 'Ouch!',
              })
              wrapper = Wrapper()
              await wrapper.setProps({ creation: [200, 400, 600] })
              await wrapper.setData({ text: 'Test create coins' })
              await wrapper.setData({ value: 90 })
              await wrapper.findAll('input[type="radio"]').at(2).setChecked()
              await wrapper.setData({ rangeMin: 180 })
              await wrapper.find('.test-submit').trigger('click')
            })

            it('toast error message', () => {
              expect(toastedErrorMock).toBeCalledWith('Ouch!')
            })
          })
        })
      })
    })
  })
})
