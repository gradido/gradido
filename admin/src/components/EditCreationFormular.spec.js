import { mount } from '@vue/test-utils'
import EditCreationFormular from './EditCreationFormular'
import { toastErrorSpy, toastSuccessSpy } from '../../test/testSetup'
import VueApollo from 'vue-apollo'
import { createMockClient } from 'mock-apollo-client'
import { adminOpenCreations } from '../graphql/adminOpenCreations'
import { adminUpdateContribution } from '../graphql/adminUpdateContribution'

const mockClient = createMockClient()
const apolloProvider = new VueApollo({
  defaultClient: mockClient,
})

const localVue = global.localVue
localVue.use(VueApollo)

const stateCommitMock = jest.fn()

const mocks = {
  $t: jest.fn((t) => t),
  $d: jest.fn((d) => {
    const date = new Date(d)
    return date.toISOString().split('T')[0]
  }),
  $store: {
    commit: stateCommitMock,
  },
}

const now = new Date()
const getCreationDate = (sub) => {
  const date = sub === 0 ? now : new Date(now.getFullYear(), now.getMonth() - sub, 1, 0)
  return date.toISOString().split('T')[0]
}

const propsData = {
  creationUserData: {
    memo: 'Test schöpfung 1',
    amount: 100,
    date: getCreationDate(0),
  },
  item: {
    id: 0,
    amount: '300',
    contributionDate: `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`,
  },
}

const data = () => {
  return { creation: ['1000', '1000', '400'] }
}

describe('EditCreationFormular', () => {
  let wrapper

  const adminUpdateContributionMock = jest.fn()
  const adminOpenCreationsMock = jest.fn()
  mockClient.setRequestHandler(
    adminOpenCreations,
    adminOpenCreationsMock.mockResolvedValue({
      data: {
        adminOpenCreations: [
          {
            month: new Date(now.getFullYear(), now.getMonth() - 2).getMonth(),
            year: new Date(now.getFullYear(), now.getMonth() - 2).getFullYear(),
            amount: '1000',
          },
          {
            month: new Date(now.getFullYear(), now.getMonth() - 1).getMonth(),
            year: new Date(now.getFullYear(), now.getMonth() - 1).getFullYear(),
            amount: '1000',
          },
          {
            month: now.getMonth(),
            year: now.getFullYear(),
            amount: '400',
          },
        ],
      },
    }),
  )
  mockClient.setRequestHandler(
    adminUpdateContribution,
    adminUpdateContributionMock.mockResolvedValue({
      data: {
        adminUpdateContribution: {
          amount: '600',
          date: new Date(),
          memo: 'This is my memo',
        },
      },
    }),
  )

  const Wrapper = () => {
    return mount(EditCreationFormular, { localVue, mocks, propsData, data, apolloProvider })
  }

  describe('mount', () => {
    beforeEach(async () => {
      wrapper = Wrapper()
      await wrapper.vm.$nextTick()
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
          expect(adminUpdateContributionMock).toBeCalledWith({
            id: 0,
            creationDate: getCreationDate(0),
            amount: 500,
            memo: 'Test Schöpfung 2',
          })
        })

        it('emits update-creation-data', () => {
          expect(wrapper.emitted('update-creation-data')).toBeTruthy()
        })

        it('toasts a success message', () => {
          expect(toastSuccessSpy).toBeCalledWith('creation_form.toasted_update')
        })
      })

      describe('change and save memo and value with error', () => {
        beforeEach(async () => {
          adminUpdateContributionMock.mockRejectedValue({ message: 'Oh no!' })
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
