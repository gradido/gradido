import { mount } from '@vue/test-utils'
import EditCreationFormular from './EditCreationFormular.vue'

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
    updatePendingCreation: {
      creation: [0, 0, 0],
      date: new Date(),
      memo: 'qwertzuiopasdfghjkl',
      moderator: 0,
    },
  },
})
const stateCommitMock = jest.fn()

const mocks = {
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
  },
}

const propsData = {
  type: '',
  item: {},
  row: [],
  creation: [],
  itemsMassCreation: {},
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

    describe('server sends back moderator data', () => {
      it('called store commit with mocked data', () => {
        expect(stateCommitMock).toBeCalledWith('moderator', { name: 'success', id: 0 })
      })
    })

    describe('server throws error for moderator data call', () => {
      beforeEach(() => {
        jest.clearAllMocks()
        apolloMock.mockRejectedValue({ message: 'Ouch!' })
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

      describe('with single creation', () => {
        beforeEach(async () => {
          jest.clearAllMocks()
          await wrapper.setProps({ type: 'singleCreation', creation: [200, 400, 600] })
          await wrapper.setData({ rangeMin: 180 })
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
        })
      })
    })
  })
})
