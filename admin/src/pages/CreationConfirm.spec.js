import { mount } from '@vue/test-utils'
import CreationConfirm from './CreationConfirm'
import { adminDeleteContribution } from '../graphql/adminDeleteContribution'
import { denyContribution } from '../graphql/denyContribution'
import { adminListAllContributions } from '../graphql/adminListAllContributions'
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
    adminListAllContributions: {
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
    adminListAllContributions,
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
          await wrapper.findAll('tr').at(1).findAll('button').at(1).trigger('click')
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
        let requestIdCounter

        beforeEach(async () => {
          requestIdCounter = wrapper.vm.$apollo.queries.ListAllContributions.observer.queryId
          await wrapper.find('a[data-test="confirmed"]').trigger('click')
        })

        it('refetches contributions', () => {
          expect(wrapper.vm.$apollo.queries.ListAllContributions.observer.queryId).toBe(
            `${Number(requestIdCounter) + 1}`,
          )
        })

        it('has statusFilter set to ["CONFIRMED"]', () => {
          expect(
            wrapper.vm.$apollo.queries.ListAllContributions.observer.options.variables,
          ).toMatchObject({ statusFilter: ['CONFIRMED'] })
        })

        describe('click tab "open"', () => {
          beforeEach(async () => {
            requestIdCounter = wrapper.vm.$apollo.queries.ListAllContributions.observer.queryId
            await wrapper.find('a[data-test="open"]').trigger('click')
          })

          it('refetches contributions', () => {
            expect(wrapper.vm.$apollo.queries.ListAllContributions.observer.queryId).toBe(
              `${Number(requestIdCounter) + 1}`,
            )
          })

          it('has statusFilter set to ["IN_PROGRESS", "PENDING"]', () => {
            expect(
              wrapper.vm.$apollo.queries.ListAllContributions.observer.options.variables,
            ).toMatchObject({ statusFilter: ['IN_PROGRESS', 'PENDING'] })
          })
        })

        describe('click tab "denied"', () => {
          beforeEach(async () => {
            requestIdCounter = wrapper.vm.$apollo.queries.ListAllContributions.observer.queryId
            await wrapper.find('a[data-test="denied"]').trigger('click')
          })

          it('refetches contributions', () => {
            expect(wrapper.vm.$apollo.queries.ListAllContributions.observer.queryId).toBe(
              `${Number(requestIdCounter) + 1}`,
            )
          })

          it('has statusFilter set to ["DENIED"]', () => {
            expect(
              wrapper.vm.$apollo.queries.ListAllContributions.observer.options.variables,
            ).toMatchObject({ statusFilter: ['DENIED'] })
          })
        })

        describe('click tab "deleted"', () => {
          beforeEach(async () => {
            requestIdCounter = wrapper.vm.$apollo.queries.ListAllContributions.observer.queryId
            await wrapper.find('a[data-test="deleted"]').trigger('click')
          })

          it('refetches contributions', () => {
            expect(wrapper.vm.$apollo.queries.ListAllContributions.observer.queryId).toBe(
              `${Number(requestIdCounter) + 1}`,
            )
          })

          it('has statusFilter set to ["DELETED"]', () => {
            expect(
              wrapper.vm.$apollo.queries.ListAllContributions.observer.options.variables,
            ).toMatchObject({ statusFilter: ['DELETED'] })
          })
        })

        describe('click tab "all"', () => {
          beforeEach(async () => {
            requestIdCounter = wrapper.vm.$apollo.queries.ListAllContributions.observer.queryId
            await wrapper.find('a[data-test="all"]').trigger('click')
          })

          it('refetches contributions', () => {
            expect(wrapper.vm.$apollo.queries.ListAllContributions.observer.queryId).toBe(
              `${Number(requestIdCounter) + 1}`,
            )
          })
          it('has statusFilter set to ["IN_PROGRESS", "PENDING", "CONFIRMED", "DENIED", "DELETED"]', () => {
            expect(
              wrapper.vm.$apollo.queries.ListAllContributions.observer.options.variables,
            ).toMatchObject({
              statusFilter: ['IN_PROGRESS', 'PENDING', 'CONFIRMED', 'DENIED', 'DELETED'],
            })
          })
        })
      })
    })

    describe('update status', () => {
      beforeEach(async () => {
        await wrapper.findComponent({ name: 'OpenCreationsTable' }).vm.$emit('update-state', 2)
      })

      it('updates the status', () => {
        expect(wrapper.vm.items.find((obj) => obj.id === 2).messagesCount).toBe(1)
        expect(wrapper.vm.items.find((obj) => obj.id === 2).state).toBe('IN_PROGRESS')
      })
    })

    describe('unknown variant', () => {
      beforeEach(async () => {
        await wrapper.setData({ variant: 'unknown' })
      })

      it('has overlay icon "info"', () => {
        expect(wrapper.vm.overlayIcon).toBe('info')
      })
    })
  })
})
