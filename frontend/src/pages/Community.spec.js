import { mount } from '@vue/test-utils'
import Community from './Community'
import { toastErrorSpy, toastSuccessSpy } from '@test/testSetup'
import { createContribution, updateContribution, deleteContribution } from '@/graphql/mutations'
import { listContributions, listAllContributions, verifyLogin } from '@/graphql/queries'

const localVue = global.localVue

const mockStoreDispach = jest.fn()
const apolloQueryMock = jest.fn()
const apolloMutationMock = jest.fn()

describe('Community', () => {
  let wrapper

  const mocks = {
    $t: jest.fn((t) => t),
    $d: jest.fn((d) => d),
    $apollo: {
      query: apolloQueryMock,
      mutate: apolloMutationMock,
    },
    $store: {
      dispatch: mockStoreDispach,
      state: {
        creation: ['1000', '1000', '1000'],
      },
    },
  }

  const Wrapper = () => {
    return mount(Community, {
      localVue,
      mocks,
    })
  }

  describe('mount', () => {
    beforeEach(() => {
      apolloQueryMock.mockResolvedValue({
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
              },
            ],
            contributionCount: 1,
          },
          listAllContributions: {
            contributionList: [
              {
                id: 1555,
                amount: '200',
                memo: 'Fleisig, fleisig am Arbeiten mein lieber Freund, 50 Zeichen sind viel',
                createdAt: '2022-07-15T08:47:06.000Z',
                deletedAt: null,
                confirmedBy: null,
                confirmedAt: null,
              },
              {
                id: 1556,
                amount: '400',
                memo: 'Ein anderer lieber Freund ist auch sehr felißig am Arbeiten!!!!',
                createdAt: '2022-07-16T08:47:06.000Z',
                deletedAt: null,
                confirmedBy: null,
                confirmedAt: null,
              },
            ],
            contributionCount: 2,
          },
        },
      })
      wrapper = Wrapper()
    })

    it('has a DIV .community-page', () => {
      expect(wrapper.find('div.community-page').exists()).toBe(true)
    })

    describe('tabs', () => {
      it('has three tabs', () => {
        expect(wrapper.findAll('div[role="tabpanel"]')).toHaveLength(3)
      })

      it('has first tab active by default', () => {
        expect(wrapper.findAll('div[role="tabpanel"]').at(0).classes('active')).toBe(true)
      })
    })

    describe('API calls after creation', () => {
      it('emits update transactions', () => {
        expect(wrapper.emitted('update-transactions')).toEqual([[0]])
      })

      it('queries list of own contributions', () => {
        expect(apolloQueryMock).toBeCalledWith({
          fetchPolicy: 'no-cache',
          query: listContributions,
          variables: {
            currentPage: 1,
            pageSize: 25,
          },
        })
      })

      it('queries list of all contributions', () => {
        expect(apolloQueryMock).toBeCalledWith({
          fetchPolicy: 'no-cache',
          query: listAllContributions,
          variables: {
            currentPage: 1,
            pageSize: 25,
          },
        })
      })

      describe('server response is error', () => {
        beforeEach(() => {
          jest.clearAllMocks()
          apolloQueryMock.mockRejectedValue({ message: 'Ups' })
          wrapper = Wrapper()
        })

        it('toasts two errors', () => {
          expect(toastErrorSpy).toBeCalledTimes(2)
          expect(toastErrorSpy).toBeCalledWith('Ups')
        })
      })
    })

    describe('set contrubtion', () => {
      describe('with success', () => {
        const now = new Date().toISOString()
        beforeEach(async () => {
          jest.clearAllMocks()
          apolloMutationMock.mockResolvedValue({
            data: {
              createContribution: true,
            },
          })
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
          expect(apolloMutationMock).toBeCalledWith({
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
          expect(apolloQueryMock).toBeCalledWith({
            fetchPolicy: 'no-cache',
            query: listContributions,
            variables: {
              currentPage: 1,
              pageSize: 25,
            },
          })
        })

        it('verifies the login (to get the new creations available)', () => {
          expect(apolloQueryMock).toBeCalledWith({
            query: verifyLogin,
            fetchPolicy: 'network-only',
          })
        })

        it('set all data to the default values)', () => {
          expect(wrapper.vm.form.id).toBe(null)
          expect(wrapper.vm.form.date).toBe('')
          expect(wrapper.vm.form.memo).toBe('')
          expect(wrapper.vm.form.amount).toBe('0')
        })
      })

      describe('with error', () => {
        const now = new Date().toISOString()
        beforeEach(async () => {
          jest.clearAllMocks()
          apolloMutationMock.mockRejectedValue({
            message: 'Ouch!',
          })
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
          expect(toastErrorSpy).toBeCalledWith('Ouch!')
        })
      })
    })

    describe('update contrubtion', () => {
      describe('with success', () => {
        const now = new Date().toISOString()
        beforeEach(async () => {
          jest.clearAllMocks()
          apolloMutationMock.mockResolvedValue({
            data: {
              updateContribution: true,
            },
          })
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
          expect(apolloMutationMock).toBeCalledWith({
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
          expect(apolloQueryMock).toBeCalledWith({
            fetchPolicy: 'no-cache',
            query: listContributions,
            variables: {
              currentPage: 1,
              pageSize: 25,
            },
          })
        })

        it('verifies the login (to get the new creations available)', () => {
          expect(apolloQueryMock).toBeCalledWith({
            query: verifyLogin,
            fetchPolicy: 'network-only',
          })
        })
      })

      describe('with error', () => {
        const now = new Date().toISOString()
        beforeEach(async () => {
          jest.clearAllMocks()
          apolloMutationMock.mockRejectedValue({
            message: 'Oh No!',
          })
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
          expect(toastErrorSpy).toBeCalledWith('Oh No!')
        })
      })
    })

    describe('delete contribution', () => {
      let contributionListComponent

      beforeEach(async () => {
        await wrapper.setData({ tabIndex: 1 })
        contributionListComponent = await wrapper.findComponent({ name: 'ContributionList' })
      })

      describe('with success', () => {
        beforeEach(async () => {
          jest.clearAllMocks()
          apolloMutationMock.mockResolvedValue({
            data: {
              deleteContribution: true,
            },
          })
          contributionListComponent.vm.$emit('delete-contribution', { id: 2 })
        })

        it('calls the API', () => {
          expect(apolloMutationMock).toBeCalledWith({
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
          expect(apolloQueryMock).toBeCalledWith({
            fetchPolicy: 'no-cache',
            query: listContributions,
            variables: {
              currentPage: 1,
              pageSize: 25,
            },
          })
        })

        it('verifies the login (to get the new creations available)', () => {
          expect(apolloQueryMock).toBeCalledWith({
            query: verifyLogin,
            fetchPolicy: 'network-only',
          })
        })
      })

      describe('with error', () => {
        beforeEach(async () => {
          jest.clearAllMocks()
          apolloMutationMock.mockRejectedValue({
            message: 'Oh my god!',
          })
          contributionListComponent.vm.$emit('delete-contribution', { id: 2 })
        })

        it('toasts the error message', () => {
          expect(toastErrorSpy).toBeCalledWith('Oh my god!')
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
        expect(wrapper.vm.form.amount).toBe('400')
      })

      it('sets tab index back to 0', () => {
        expect(wrapper.vm.tabIndex).toBe(0)
      })
    })
  })
})
