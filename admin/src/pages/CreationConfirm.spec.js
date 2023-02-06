import { mount } from '@vue/test-utils'
import CreationConfirm from './CreationConfirm.vue'
import { adminDeleteContribution } from '../graphql/adminDeleteContribution'
import { denyContribution } from '../graphql/denyContribution'
import { listAllContributions } from '../graphql/listAllContributions'
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
    listAllContributions: {
      contributionCount: 2,
      contributionList: [
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
          messagesCount: 0,
          deniedBy: null,
          deniedAt: null,
          confirmedBy: null,
          confirmedAt: null,
          contributionDate: new Date(),
          deletedBy: null,
          deletedAt: null,
          createdAt: new Date(),
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
          messagesCount: 0,
          deniedBy: null,
          deniedAt: null,
          confirmedBy: null,
          confirmedAt: null,
          contributionDate: new Date(),
          deletedBy: null,
          deletedAt: null,
          createdAt: new Date(),
        },
      ],
    },
  }
}

describe('CreationConfirm', () => {
  let wrapper
  const adminDeleteContributionMock = jest.fn()
  const adminDenyContributionMock = jest.fn()
  const confirmContributionMock = jest.fn()

  mockClient.setRequestHandler(
    listAllContributions,
    jest
      .fn()
      .mockRejectedValueOnce({ message: 'Ouch!' })
      .mockResolvedValue({ data: defaultData() }),
  )

  mockClient.setRequestHandler(
    adminDeleteContribution,
    adminDeleteContributionMock.mockResolvedValue({ data: { adminDeleteContribution: true } }),
  )

  mockClient.setRequestHandler(
    denyContribution,
    adminDenyContributionMock
      .mockRejectedValueOnce({ message: 'Ouch!' })
      .mockResolvedValue({ data: { denyContribution: true } }),
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

      it('has statusFilter ["IN_PROGRESS", "PENDING"]', () => {
        expect(wrapper.vm.statusFilter).toEqual(['IN_PROGRESS', 'PENDING'])
      })
    })

    describe('server response is succes', () => {
      it('has a DIV element with the class.creation-confirm', () => {
        expect(wrapper.find('div.creation-confirm').exists()).toBeTruthy()
      })

      it('has two pending creations', () => {
        expect(wrapper.find('tbody').findAll('tr')).toHaveLength(2)
      })
    })

    describe('actions in overlay', () => {
      describe('delete creation', () => {
        beforeEach(async () => {
          await wrapper.findAll('tr').at(1).findAll('button').at(0).trigger('click')
        })

        it('opens the overlay', () => {
          expect(wrapper.find('#overlay').isVisible()).toBeTruthy()
        })

        describe('with success', () => {
          describe('cancel deletion', () => {
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

          describe('confirm deletion', () => {
            beforeEach(async () => {
              await wrapper.find('#overlay').findAll('button').at(1).trigger('click')
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

            it('has 1 item left in the table', () => {
              expect(wrapper.findAll('tbody > tr')).toHaveLength(1)
            })
          })

          describe('with error', () => {
            beforeEach(async () => {
              adminDeleteContributionMock.mockRejectedValue({ message: 'Ouchhh!' })
              await wrapper.find('#overlay').findAll('button').at(1).trigger('click')
            })

            it('toasts an error message', () => {
              expect(toastErrorSpy).toBeCalledWith('Ouchhh!')
            })
          })
        })
      })

      describe('confirm creation', () => {
        beforeEach(async () => {
          await wrapper.findAll('tr').at(2).findAll('button').at(3).trigger('click')
        })

        it('opens the overlay', () => {
          expect(wrapper.find('#overlay').isVisible()).toBeTruthy()
        })

        describe('with succes', () => {
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

          describe('confirm confirmation', () => {
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
        })

        describe('with error', () => {
          beforeEach(async () => {
            confirmContributionMock.mockRejectedValue({ message: 'Ouchhh!' })
            await wrapper.find('#overlay').findAll('button').at(1).trigger('click')
          })

          it('toasts an error message', () => {
            expect(toastErrorSpy).toBeCalledWith('Ouchhh!')
          })
        })
      })

      describe('deny creation', () => {
        beforeEach(async () => {
          await wrapper.findAll('tr').at(1).findAll('button').at(2).trigger('click')
        })

        it('opens the overlay', () => {
          expect(wrapper.find('#overlay').isVisible()).toBeTruthy()
        })

        describe('with succes', () => {
          describe('cancel deny', () => {
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

          describe('confirm deny', () => {
            beforeEach(async () => {
              await wrapper.find('#overlay').findAll('button').at(1).trigger('click')
            })

            it('calls the denyContribution mutation', () => {
              expect(adminDenyContributionMock).toBeCalledWith({ id: 1 })
            })

            it('commits openCreationsMinus to store', () => {
              expect(storeCommitMock).toBeCalledWith('openCreationsMinus', 1)
            })

            it('toasts a success message', () => {
              expect(toastSuccessSpy).toBeCalledWith('creation_form.toasted_denied')
            })

            it('has 1 item left in the table', () => {
              expect(wrapper.findAll('tbody > tr')).toHaveLength(1)
            })
          })
        })

        describe('with error', () => {
          beforeEach(async () => {
            adminDenyContributionMock.mockRejectedValue({ message: 'Ouchhh!' })
            await wrapper.find('#overlay').findAll('button').at(1).trigger('click')
          })

          it('toasts an error message', () => {
            expect(toastErrorSpy).toBeCalledWith('Ouchhh!')
          })
        })
      })
    })

    describe('filter tabs', () => {
      describe('click tab "confirmed"', () => {
        let refetchSpy

        beforeEach(async () => {
          jest.clearAllMocks()
          refetchSpy = jest.spyOn(wrapper.vm.$apollo.queries.ListAllContributions, 'refetch')
          await wrapper.find('a[data-test="confirmed"]').trigger('click')
        })

        it('has statusFilter set to ["CONFIRMED"]', () => {
          expect(
            wrapper.vm.$apollo.queries.ListAllContributions.observer.options.variables,
          ).toMatchObject({ statusFilter: ['CONFIRMED'] })
        })

        it('refetches contributions', () => {
          expect(refetchSpy).toBeCalled()
        })

        describe('click tab "open"', () => {
          beforeEach(async () => {
            jest.clearAllMocks()
            refetchSpy = jest.spyOn(wrapper.vm.$apollo.queries.ListAllContributions, 'refetch')
            await wrapper.find('a[data-test="open"]').trigger('click')
          })

          it('has statusFilter set to ["IN_PROGRESS", "PENDING"]', () => {
            expect(
              wrapper.vm.$apollo.queries.ListAllContributions.observer.options.variables,
            ).toMatchObject({ statusFilter: ['IN_PROGRESS', 'PENDING'] })
          })

          it('refetches contributions', () => {
            expect(refetchSpy).toBeCalled()
          })
        })

        describe('click tab "denied"', () => {
          beforeEach(async () => {
            jest.clearAllMocks()
            refetchSpy = jest.spyOn(wrapper.vm.$apollo.queries.ListAllContributions, 'refetch')
            await wrapper.find('a[data-test="denied"]').trigger('click')
          })

          it('has statusFilter set to ["DENIED"]', () => {
            expect(
              wrapper.vm.$apollo.queries.ListAllContributions.observer.options.variables,
            ).toMatchObject({ statusFilter: ['DENIED'] })
          })

          it('refetches contributions', () => {
            expect(refetchSpy).toBeCalled()
          })
        })

        describe('click tab "all"', () => {
          beforeEach(async () => {
            jest.clearAllMocks()
            refetchSpy = jest.spyOn(wrapper.vm.$apollo.queries.ListAllContributions, 'refetch')
            await wrapper.find('a[data-test="all"]').trigger('click')
          })

          it('has statusFilter set to ["IN_PROGRESS", "PENDING", "CONFIRMED", "DENIED", "DELETED"]', () => {
            expect(
              wrapper.vm.$apollo.queries.ListAllContributions.observer.options.variables,
            ).toMatchObject({
              statusFilter: ['IN_PROGRESS', 'PENDING', 'CONFIRMED', 'DENIED', 'DELETED'],
            })
          })

          it('refetches contributions', () => {
            expect(refetchSpy).toBeCalled()
          })
        })
      })
    })

    describe('update status', () => {
      beforeEach(async () => {
        await wrapper.findComponent({ name: 'OpenCreationsTable' }).vm.$emit('update-state', 2)
      })

      it.skip('updates the status', () => {
        expect(wrapper.vm.items.find((obj) => obj.id === 2).messagesCount).toBe(1)
        expect(wrapper.vm.items.find((obj) => obj.id === 2).state).toBe('IN_PROGRESS')
      })
    })
  })
})
