import { mount } from '@vue/test-utils'
import CreationConfirm from './CreationConfirm.vue'
import { adminDeleteContribution } from '../graphql/adminDeleteContribution'
import { denyContribution } from '../graphql/denyContribution'
import { listUnconfirmedContributions } from '../graphql/listUnconfirmedContributions'
import { confirmContribution } from '../graphql/confirmContribution'
import { toastErrorSpy, toastSuccessSpy } from '../../test/testSetup'
import VueApollo from 'vue-apollo'
import { createMockClient } from 'mock-apollo-client'

const mockClient = createMockClient()
const apolloProvider = new VueApollo({
  defaultClient: mockClient,
})

const localVue = global.localVue

localVue.use(VueApollo)

const storeCommitMock = jest.fn()

const mocks = {
  $t: jest.fn((t) => t),
  $d: jest.fn((d) => d),
  $store: {
    commit: storeCommitMock,
    state: {
      moderator: {
        firstName: 'Peter',
        lastName: 'Lustig',
        isAdmin: '2022-08-30T07:41:31.000Z',
        id: 263,
        language: 'de',
      },
    },
  },
}

const defaultData = () => {
  return {
    listUnconfirmedContributions: [
      {
        id: 1,
        firstName: 'Bibi',
        lastName: 'Bloxberg',
        userId: 99,
        email: 'bibi@bloxberg.de',
        amount: 500,
        memo: 'Danke für alles',
        date: new Date(),
        moderator: 1,
        state: 'PENDING',
        creation: [500, 500, 500],
        messageCount: 0,
      },
      {
        id: 2,
        firstName: 'Räuber',
        lastName: 'Hotzenplotz',
        userId: 100,
        email: 'raeuber@hotzenplotz.de',
        amount: 1000000,
        memo: 'Gut Ergattert',
        date: new Date(),
        moderator: 1,
        state: 'PENDING',
        creation: [500, 500, 500],
        messageCount: 0,
      },
    ],
  }
}

describe('CreationConfirm', () => {
  let wrapper

  const listUnconfirmedContributionsMock = jest.fn()
  const adminDeleteContributionMock = jest.fn()
  const adminRejectContributionMock = jest.fn()
  const confirmContributionMock = jest.fn()

  mockClient.setRequestHandler(
    listUnconfirmedContributions,
    listUnconfirmedContributionsMock
      .mockRejectedValueOnce({ message: 'Ouch!' })
      .mockResolvedValue({ data: defaultData() }),
  )

  mockClient.setRequestHandler(
    adminDeleteContribution,
    adminDeleteContributionMock.mockResolvedValue({ data: { adminDeleteContribution: true } }),
  )

  mockClient.setRequestHandler(
    denyContribution,
    adminRejectContributionMock.mockResolvedValue({ data: { denyContribution: true } }),
  )

  mockClient.setRequestHandler(
    confirmContribution,
    confirmContributionMock.mockResolvedValue({ data: { confirmContribution: true } }),
  )

  const Wrapper = () => {
    return mount(CreationConfirm, { localVue, mocks, apolloProvider })
  }

  describe('mount', () => {
    beforeEach(() => {
      jest.clearAllMocks()
      wrapper = Wrapper()
    })

    describe('server response for get pending creations is error', () => {
      it('toast an error message', () => {
        expect(toastErrorSpy).toBeCalledWith('Ouch!')
      })
    })

    describe('server response is succes', () => {
      it('has a DIV element with the class.creation-confirm', () => {
        expect(wrapper.find('div.creation-confirm').exists()).toBeTruthy()
      })

      it('has two pending creations', () => {
        expect(wrapper.vm.pendingCreations).toHaveLength(2)
      })
    })

    describe('store', () => {
      it('commits resetOpenCreations to store', () => {
        expect(storeCommitMock).toBeCalledWith('resetOpenCreations')
      })

      it('commits setOpenCreations to store', () => {
        expect(storeCommitMock).toBeCalledWith('setOpenCreations', 2)
      })
    })

    describe('remove creation with success', () => {
      let spy

      describe('admin confirms deletion', () => {
        beforeEach(async () => {
          spy = jest.spyOn(wrapper.vm.$bvModal, 'msgBoxConfirm')
          spy.mockImplementation(() => Promise.resolve('some value'))
          await wrapper.findAll('tr').at(1).findAll('button').at(0).trigger('click')
        })

        it('opens a modal', () => {
          expect(spy).toBeCalled()
        })

        it('calls the adminDeleteContribution mutation', () => {
          expect(adminDeleteContributionMock).toBeCalledWith({ id: 1 })
        })

        it('commits openCreationsMinus to store', () => {
          expect(storeCommitMock).toBeCalledWith('openCreationsMinus', 1)
        })

        it('toasts a success message', () => {
          expect(toastSuccessSpy).toBeCalledWith('creation_form.toasted_delete')
        })
      })

      describe('admin cancels deletion', () => {
        beforeEach(async () => {
          spy = jest.spyOn(wrapper.vm.$bvModal, 'msgBoxConfirm')
          spy.mockImplementation(() => Promise.resolve(false))
          await wrapper.findAll('tr').at(1).findAll('button').at(0).trigger('click')
        })

        it('does not call the adminDeleteContribution mutation', () => {
          expect(adminDeleteContributionMock).not.toBeCalled()
        })
      })
    })

    describe('remove creation with error', () => {
      let spy

      beforeEach(async () => {
        spy = jest.spyOn(wrapper.vm.$bvModal, 'msgBoxConfirm')
        spy.mockImplementation(() => Promise.resolve('some value'))
        adminDeleteContributionMock.mockRejectedValue({ message: 'Ouchhh!' })
        await wrapper.findAll('tr').at(1).findAll('button').at(0).trigger('click')
      })

      it('toasts an error message', () => {
        expect(toastErrorSpy).toBeCalledWith('Ouchhh!')
      })
    })

    describe('confirm creation with success', () => {
      beforeEach(async () => {
        await wrapper.findAll('tr').at(2).findAll('button').at(2).trigger('click')
      })

      describe('overlay', () => {
        it('opens the overlay', () => {
          expect(wrapper.find('#overlay').isVisible()).toBeTruthy()
        })

        describe('cancel confirmation', () => {
          beforeEach(async () => {
            await wrapper.find('#overlay').findAll('button').at(0).trigger('click')
          })

          it('closes the overlay', async () => {
            expect(wrapper.find('#overlay').exists()).toBeFalsy()
          })

          it('still has 2 items in the table', () => {
            expect(wrapper.findAll('tbody > tr')).toHaveLength(2)
          })
        })

        describe('confirm creation', () => {
          beforeEach(async () => {
            await wrapper.find('#overlay').findAll('button').at(1).trigger('click')
          })

          it('calls the confirmContribution mutation', () => {
            expect(confirmContributionMock).toBeCalledWith({ id: 2 })
          })

          it('commits openCreationsMinus to store', () => {
            expect(storeCommitMock).toBeCalledWith('openCreationsMinus', 1)
          })

          it('toasts a success message', () => {
            expect(toastSuccessSpy).toBeCalledWith('creation_form.toasted_created')
          })

          it('has 1 item left in the table', () => {
            expect(wrapper.findAll('tbody > tr')).toHaveLength(1)
          })
        })

        describe('confirm creation with error', () => {
          beforeEach(async () => {
            confirmContributionMock.mockRejectedValue({ message: 'Ouchhh!' })
            await wrapper.find('#overlay').findAll('button').at(1).trigger('click')
          })

          it('toasts an error message', () => {
            expect(toastErrorSpy).toBeCalledWith('Ouchhh!')
          })
        })
      })
    })

    describe('decline creation with success', () => {
      let spy

      describe('admin confirms decline', () => {
        beforeEach(async () => {
          spy = jest.spyOn(wrapper.vm.$bvModal, 'msgBoxConfirm')
          spy.mockImplementation(() => Promise.resolve('some value'))
          await wrapper.findAll('tr').at(1).findAll('button').at(3).trigger('click')
        })

        it('opens a modal', () => {
          expect(spy).toBeCalled()
        })

        it('calls the adminDeleteContribution mutation', () => {
          expect(adminRejectContributionMock).toBeCalledWith({ id: 1 })
        })

        it('commits openCreationsMinus to store', () => {
          expect(storeCommitMock).toBeCalledWith('openCreationsMinus', 1)
        })

        it('toasts a success message', () => {
          expect(toastSuccessSpy).toBeCalledWith('creation_form.toasted_denied')
        })
      })

      describe('admin cancels decline', () => {
        beforeEach(async () => {
          spy = jest.spyOn(wrapper.vm.$bvModal, 'msgBoxConfirm')
          spy.mockImplementation(() => Promise.resolve(false))
          await wrapper.findAll('tr').at(1).findAll('button').at(3).trigger('click')
        })

        it('does not call the adminDeleteContribution mutation', () => {
          expect(adminRejectContributionMock).not.toBeCalled()
        })
      })
    })
  })
})
