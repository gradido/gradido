import { mount } from '@vue/test-utils'
import Community from './Community'
import { toastErrorSpy, toastSuccessSpy, toastInfoSpy } from '@test/testSetup'
import { createContribution, updateContribution, deleteContribution } from '@/graphql/mutations'
import { listContributions, listAllContributions, openCreations } from '@/graphql/queries'
import { createMockClient } from 'mock-apollo-client'
import VueApollo from 'vue-apollo'

const mockClient = createMockClient()
const apolloProvider = new VueApollo({
  defaultClient: mockClient,
})

const localVue = global.localVue
localVue.use(VueApollo)

const mockStoreDispach = jest.fn()
const routerPushMock = jest.fn()

describe('Community', () => {
  let wrapper

  mockClient.setRequestHandler(
    openCreations,
    jest
      .fn()
      .mockRejectedValueOnce({ message: 'Open Creations failed!' })
      .mockResolvedValue({
        data: {
          openCreations: [
            {
              month: 0,
              year: 2023,
              amount: '1000',
            },
            {
              month: 1,
              year: 2023,
              amount: '1000',
            },
            {
              month: 2,
              year: 2023,
              amount: '1000',
            },
          ],
        },
      }),
  )

  mockClient.setRequestHandler(
    listContributions,
    jest
      .fn()
      .mockRejectedValueOnce({ message: 'List Contributions failed!' })
      .mockResolvedValue({
        data: {
          listContributions: {
            contributionList: [
              {
                id: 1555,
                amount: '200',
                memo: 'Fleisig, fleisig am Arbeiten mein lieber Freund, 50 Zeichen sind viel',
                createdAt: '2022-07-15T08:47:06.000Z',
                deletedAt: null,
                confirmedBy: null,
                confirmedAt: null,
                firstName: 'Bibi',
                contributionDate: '2022-07-15T08:47:06.000Z',
                lastName: 'Bloxberg',
                state: 'IN_PROGRESS',
                messagesCount: 0,
              },
              {
                id: 1550,
                amount: '200',
                memo: 'Fleisig, fleisig am Arbeiten gewesen',
                createdAt: '2022-07-15T08:47:06.000Z',
                deletedAt: null,
                confirmedBy: null,
                confirmedAt: null,
                firstName: 'Bibi',
                contributionDate: '2022-06-15T08:47:06.000Z',
                lastName: 'Bloxberg',
                state: 'CONFIRMED',
                messagesCount: 0,
              },
            ],
            contributionCount: 1,
          },
        },
      }),
  )

  mockClient.setRequestHandler(
    listAllContributions,
    jest
      .fn()
      .mockRejectedValueOnce({ message: 'List All Contributions failed!' })
      .mockResolvedValue({
        data: {
          listAllContributions: {
            contributionList: [
              {
                id: 1555,
                amount: '200',
                memo: 'Fleisig, fleisig am Arbeiten mein lieber Freund, 50 Zeichen sind viel',
                createdAt: '2022-07-15T08:47:06.000Z',
                contributionDate: '2022-07-15T08:47:06.000Z',
                deletedAt: null,
                confirmedBy: null,
                confirmedAt: null,
                firstName: 'Bibi',
                lastName: 'Bloxberg',
              },
              {
                id: 1550,
                amount: '200',
                memo: 'Fleisig, fleisig am Arbeiten gewesen',
                createdAt: '2022-07-15T08:47:06.000Z',
                deletedAt: null,
                confirmedBy: null,
                confirmedAt: null,
                firstName: 'Bibi',
                contributionDate: '2022-06-15T08:47:06.000Z',
                lastName: 'Bloxberg',
                messagesCount: 0,
              },
              {
                id: 1556,
                amount: '400',
                memo: 'Ein anderer lieber Freund ist auch sehr felißig am Arbeiten!!!!',
                createdAt: '2022-07-16T08:47:06.000Z',
                contributionDate: '2022-07-16T08:47:06.000Z',
                deletedAt: null,
                confirmedBy: null,
                confirmedAt: null,
                firstName: 'Bob',
                lastName: 'der Baumeister',
              },
            ],
            contributionCount: 3,
          },
        },
      }),
  )

  mockClient.setRequestHandler(
    createContribution,
    jest
      .fn()
      .mockRejectedValueOnce({ message: 'Create Contribution failed!' })
      .mockResolvedValue({
        data: {
          createContribution: true,
        },
      }),
  )

  mockClient.setRequestHandler(
    updateContribution,
    jest
      .fn()
      .mockRejectedValueOnce({ message: 'Update Contribution failed!' })
      .mockResolvedValue({
        data: {
          updateContribution: true,
        },
      }),
  )

  mockClient.setRequestHandler(
    deleteContribution,
    jest
      .fn()
      .mockRejectedValueOnce({ message: 'Delete Contribution failed!' })
      .mockResolvedValue({
        data: {
          deleteContribution: true,
        },
      }),
  )

  const mocks = {
    $t: jest.fn((t) => t),
    $d: jest.fn((d) => d),
    $store: {
      dispatch: mockStoreDispach,
      state: {
        user: {
          firstName: 'Bibi',
          lastName: 'Bloxberg',
        },
      },
    },
    $i18n: {
      locale: 'en',
    },
    $router: {
      push: routerPushMock,
    },
    $route: {
      hash: '#edit',
    },
  }

  const Wrapper = () => {
    return mount(Community, {
      localVue,
      mocks,
      apolloProvider,
    })
  }

  let apolloMutateSpy
  let refetchContributionsSpy
  let refetchAllContributionsSpy
  let refetchOpenCreationsSpy

  describe('mount', () => {
    beforeEach(() => {
      jest.clearAllMocks()
      wrapper = Wrapper()
      apolloMutateSpy = jest.spyOn(wrapper.vm.$apollo, 'mutate')
      refetchContributionsSpy = jest.spyOn(wrapper.vm.$apollo.queries.ListContributions, 'refetch')
      refetchAllContributionsSpy = jest.spyOn(
        wrapper.vm.$apollo.queries.ListAllContributions,
        'refetch',
      )
      refetchOpenCreationsSpy = jest.spyOn(wrapper.vm.$apollo.queries.OpenCreations, 'refetch')
    })

    describe('server response for queries is error', () => {
      it('toasts three errors', () => {
        expect(toastErrorSpy).toBeCalledTimes(3)
        expect(toastErrorSpy).toBeCalledWith('Open Creations failed!')
        expect(toastErrorSpy).toBeCalledWith('List Contributions failed!')
        expect(toastErrorSpy).toBeCalledWith('List All Contributions failed!')
      })
    })

    describe('tabs', () => {
      it('has three tabs', () => {
        expect(wrapper.findAll('div[role="tabpanel"]')).toHaveLength(3)
      })

      it('check for correct tabIndex if state is "IN_PROGRESS" or not', () => {
        expect(routerPushMock).toBeCalledWith({ path: '/community#my' })
      })

      it('toasts an info', () => {
        expect(toastInfoSpy).toBeCalledWith(
          'contribution.alert.answerQuestionToast',
        )
      })
    })

    describe('API calls after creation', () => {
      it('has a DIV .community-page', () => {
        expect(wrapper.find('div.community-page').exists()).toBe(true)
      })

      it('emits update transactions', () => {
        expect(wrapper.emitted('update-transactions')).toEqual([[0]])
      })
    })

    describe('save contrubtion', () => {
      describe('with error', () => {
        const now = new Date().toISOString()
        beforeEach(async () => {
          await wrapper.setData({
            form: {
              id: null,
              date: now,
              memo: 'Mein Beitrag zur Gemeinschaft für diesen Monat ...',
              amount: '200',
            },
          })
          await wrapper.find('form').trigger('submit')
        })

        it('toasts the error message', () => {
          expect(toastErrorSpy).toBeCalledWith('Create Contribution failed!')
        })
      })

      describe('with success', () => {
        const now = new Date().toISOString()
        beforeEach(async () => {
          jest.clearAllMocks()
          await wrapper.setData({
            form: {
              id: null,
              date: now,
              memo: 'Mein Beitrag zur Gemeinschaft für diesen Monat ...',
              amount: '200',
            },
          })
          await wrapper.find('form').trigger('submit')
        })

        it('calls the create contribution mutation', () => {
          expect(apolloMutateSpy).toBeCalledWith({
            fetchPolicy: 'no-cache',
            mutation: createContribution,
            variables: {
              creationDate: now,
              memo: 'Mein Beitrag zur Gemeinschaft für diesen Monat ...',
              amount: '200',
            },
          })
        })

        it('toasts a success message', () => {
          expect(toastSuccessSpy).toBeCalledWith('contribution.submitted')
        })

        it('updates the contribution list', () => {
          expect(refetchContributionsSpy).toBeCalled()
        })

        it('updates the all contribution list', () => {
          expect(refetchAllContributionsSpy).toBeCalled()
        })

        it('updates the open creations', () => {
          expect(refetchOpenCreationsSpy).toBeCalled()
        })

        it('sets all data to the default values)', () => {
          expect(wrapper.vm.form.id).toBe(null)
          expect(wrapper.vm.form.date).toBe('')
          expect(wrapper.vm.form.memo).toBe('')
          expect(wrapper.vm.form.amount).toBe('')
        })
      })
    })

    describe('update contrubtion', () => {
      describe('with error', () => {
        const now = new Date().toISOString()
        beforeEach(async () => {
          await wrapper
            .findComponent({ name: 'ContributionForm' })
            .vm.$emit('update-contribution', {
              id: 2,
              date: now,
              memo: 'Mein Beitrag zur Gemeinschaft für diesen Monat ...',
              amount: '400',
            })
        })

        it('toasts the error message', () => {
          expect(toastErrorSpy).toBeCalledWith('Update Contribution failed!')
        })
      })

      describe('with success', () => {
        const now = new Date().toISOString()
        beforeEach(async () => {
          jest.clearAllMocks()
          await wrapper
            .findComponent({ name: 'ContributionForm' })
            .vm.$emit('update-contribution', {
              id: 2,
              date: now,
              memo: 'Mein Beitrag zur Gemeinschaft für diesen Monat ...',
              amount: '400',
            })
        })

        it('calls the update contribution mutation', () => {
          expect(apolloMutateSpy).toBeCalledWith({
            fetchPolicy: 'no-cache',
            mutation: updateContribution,
            variables: {
              contributionId: 2,
              creationDate: now,
              memo: 'Mein Beitrag zur Gemeinschaft für diesen Monat ...',
              amount: '400',
            },
          })
        })

        it('toasts a success message', () => {
          expect(toastSuccessSpy).toBeCalledWith('contribution.updated')
        })

        it('updates the contribution list', () => {
          expect(refetchContributionsSpy).toBeCalled()
        })

        it('updates the all contribution list', () => {
          expect(refetchAllContributionsSpy).toBeCalled()
        })

        it('updates the open creations', () => {
          expect(refetchOpenCreationsSpy).toBeCalled()
        })
      })
    })

    describe('delete contribution', () => {
      let contributionListComponent

      beforeEach(async () => {
        await wrapper.setData({ tabIndex: 1 })
        contributionListComponent = wrapper.findComponent({ name: 'ContributionList' })
      })

      describe('with error', () => {
        beforeEach(async () => {
          jest.clearAllMocks()
          contributionListComponent.vm.$emit('delete-contribution', { id: 2 })
        })

        it('toasts the error message', () => {
          expect(toastErrorSpy).toBeCalledWith('Delete Contribution failed!')
        })
      })

      describe('with success', () => {
        beforeEach(async () => {
          jest.clearAllMocks()
          await contributionListComponent.vm.$emit('delete-contribution', { id: 2 })
        })

        it('calls the API', () => {
          expect(apolloMutateSpy).toBeCalledWith({
            fetchPolicy: 'no-cache',
            mutation: deleteContribution,
            variables: {
              id: 2,
            },
          })
        })

        it('toasts a success message', () => {
          expect(toastSuccessSpy).toBeCalledWith('contribution.deleted')
        })

        it('updates the contribution list', () => {
          expect(refetchContributionsSpy).toBeCalled()
        })

        it('updates the all contribution list', () => {
          expect(refetchAllContributionsSpy).toBeCalled()
        })

        it('updates the open creations', () => {
          expect(refetchOpenCreationsSpy).toBeCalled()
        })
      })
    })

    describe('update contribution form', () => {
      const now = new Date().toISOString()
      beforeEach(async () => {
        await wrapper.setData({ tabIndex: 1 })
        await wrapper
          .findComponent({ name: 'ContributionList' })
          .vm.$emit('update-contribution-form', {
            id: 2,
            contributionDate: now,
            memo: 'Mein Beitrag zur Gemeinschaft für diesen Monat ...',
            amount: '400',
          })
      })

      it('sets the form data to the new values', () => {
        expect(wrapper.vm.form.id).toBe(2)
        expect(wrapper.vm.form.date).toBe(now)
        expect(wrapper.vm.form.memo).toBe('Mein Beitrag zur Gemeinschaft für diesen Monat ...')
        expect(wrapper.vm.form.amount).toBe('400.00')
      })

      it('sets tab index back to 0', () => {
        expect(wrapper.vm.tabIndex).toBe(0)
      })
    })

    describe('update list all contributions', () => {
      beforeEach(async () => {
        jest.clearAllMocks()
        await wrapper.setData({ tabIndex: 2 })
        await wrapper
          .findAllComponents({ name: 'ContributionList' })
          .at(1)
          .vm.$emit('update-list-contributions', {
            currentPage: 2,
            pageSize: 5,
          })
      })

      it('updates page size and current page', () => {
        expect(wrapper.vm.pageSizeAll).toBe(5)
        expect(wrapper.vm.currentPageAll).toBe(2)
      })

      it('updates the all contribution list', () => {
        expect(refetchAllContributionsSpy).toBeCalled()
      })
    })

    describe('update list contributions', () => {
      beforeEach(async () => {
        jest.clearAllMocks()
        await wrapper.setData({ tabIndex: 1 })
        await wrapper
          .findAllComponents({ name: 'ContributionList' })
          .at(0)
          .vm.$emit('update-list-contributions', {
            currentPage: 2,
            pageSize: 5,
          })
      })

      it('updates page size and current page', () => {
        expect(wrapper.vm.pageSize).toBe(5)
        expect(wrapper.vm.currentPage).toBe(2)
      })

      it('updates the all contribution list', () => {
        expect(refetchContributionsSpy).toBeCalled()
      })
    })
  })
})
