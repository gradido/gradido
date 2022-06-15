import { mount } from '@vue/test-utils'
import EditCreationFormular from './EditCreationFormular.vue'
import { toastErrorSpy, toastSuccessSpy } from '../../test/testSetup'

const localVue = global.localVue

const apolloMutateMock = jest.fn().mockResolvedValue({
  data: {
    adminUpdateContribution: {
      creation: [0, 0, 0],
      amount: 500,
      date: new Date(),
      memo: 'Test Schöpfung 2',
    },
  },
})

const stateCommitMock = jest.fn()

const mocks = {
  $t: jest.fn((t) => t),
  $d: jest.fn((d) => {
    const date = new Date(d)
    return date.toISOString().split('T')[0]
  }),
  $apollo: {
    mutate: apolloMutateMock,
  },
  $store: {
    commit: stateCommitMock,
  },
}

const now = new Date(Date.now())
const getCreationDate = (sub) => {
  const date = sub === 0 ? now : new Date(now.getFullYear(), now.getMonth() - sub, 1, 0)
  return date.toISOString().split('T')[0]
}

const propsData = {
  creation: [200, 400, 600],
  creationUserData: {
    memo: 'Test schöpfung 1',
    amount: 100,
    date: getCreationDate(0),
  },
  item: {
    id: 0,
    email: 'bob@baumeister.de',
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

      it('has the third radio button checked', () => {
        expect(wrapper.findAll('input[type="radio"]').at(0).element.checked).toBeFalsy()
        expect(wrapper.findAll('input[type="radio"]').at(1).element.checked).toBeFalsy()
        expect(wrapper.findAll('input[type="radio"]').at(2).element.checked).toBeTruthy()
      })

      it('has rangeMax of 700', () => {
        expect(wrapper.find('input[type="number"]').attributes('max')).toBe('700')
      })

      describe('change and save memo and value with success', () => {
        beforeEach(async () => {
          await wrapper.find('input[type="number"]').setValue(500)
          await wrapper.find('textarea').setValue('Test Schöpfung 2')
          await wrapper.find('.test-submit').trigger('click')
        })

        it('calls the API', () => {
          expect(apolloMutateMock).toBeCalledWith(
            expect.objectContaining({
              variables: {
                id: 0,
                email: 'bob@baumeister.de',
                creationDate: getCreationDate(0),
                amount: 500,
                memo: 'Test Schöpfung 2',
              },
            }),
          )
        })

        it('emits update-user-data', () => {
          expect(wrapper.emitted('update-user-data')).toEqual([
            [
              {
                id: 0,
                email: 'bob@baumeister.de',
              },
              [0, 0, 0],
            ],
          ])
        })

        it('emits update-creation-data', () => {
          expect(wrapper.emitted('update-creation-data')).toEqual([
            [
              {
                amount: 500,
                date: expect.any(Date),
                memo: 'Test Schöpfung 2',
                row: expect.any(Object),
              },
            ],
          ])
        })

        it('toasts a success message', () => {
          expect(toastSuccessSpy).toBeCalledWith('creation_form.toasted_update')
        })
      })

      describe('change and save memo and value with error', () => {
        beforeEach(async () => {
          apolloMutateMock.mockRejectedValue({ message: 'Oh no!' })
          await wrapper.find('input[type="number"]').setValue(500)
          await wrapper.find('textarea').setValue('Test Schöpfung 2')
          await wrapper.find('.test-submit').trigger('click')
        })

        it('toasts an error message', () => {
          expect(toastErrorSpy).toBeCalledWith('Oh no!')
        })
      })
    })
  })
})
