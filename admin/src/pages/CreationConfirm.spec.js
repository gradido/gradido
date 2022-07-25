import { mount } from '@vue/test-utils'
import CreationConfirm from './CreationConfirm.vue'
import { adminDeleteContribution } from '../graphql/adminDeleteContribution'
import { confirmContribution } from '../graphql/confirmContribution'
import { toastErrorSpy, toastSuccessSpy } from '../../test/testSetup'

const localVue = global.localVue

const storeCommitMock = jest.fn()
const apolloQueryMock = jest.fn().mockResolvedValue({
  data: {
    listUnconfirmedContributions: [
      {
        id: 1,
        firstName: 'Bibi',
        lastName: 'Bloxberg',
        email: 'bibi@bloxberg.de',
        amount: 500,
        memo: 'Danke für alles',
        date: new Date(),
        moderator: 0,
      },
      {
        id: 2,
        firstName: 'Räuber',
        lastName: 'Hotzenplotz',
        email: 'raeuber@hotzenplotz.de',
        amount: 1000000,
        memo: 'Gut Ergattert',
        date: new Date(),
        moderator: 0,
      },
    ],
  },
})

const apolloMutateMock = jest.fn().mockResolvedValue({})

const mocks = {
  $t: jest.fn((t) => t),
  $d: jest.fn((d) => d),
  $store: {
    commit: storeCommitMock,
  },
  $apollo: {
    query: apolloQueryMock,
    mutate: apolloMutateMock,
  },
}

describe('CreationConfirm', () => {
  let wrapper

  const Wrapper = () => {
    return mount(CreationConfirm, { localVue, mocks })
  }

  describe('mount', () => {
    beforeEach(() => {
      jest.clearAllMocks()
      wrapper = Wrapper()
    })

    it('has a DIV element with the class.creation-confirm', () => {
      expect(wrapper.find('div.creation-confirm').exists()).toBeTruthy()
    })

    it('has two pending creations', () => {
      expect(wrapper.vm.pendingCreations).toHaveLength(2)
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
          expect(apolloMutateMock).toBeCalledWith({
            mutation: adminDeleteContribution,
            variables: { id: 1 },
          })
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
          expect(apolloMutateMock).not.toBeCalled()
        })
      })
    })

    describe('remove creation with error', () => {
      let spy

      beforeEach(async () => {
        spy = jest.spyOn(wrapper.vm.$bvModal, 'msgBoxConfirm')
        spy.mockImplementation(() => Promise.resolve('some value'))
        apolloMutateMock.mockRejectedValue({ message: 'Ouchhh!' })
        await wrapper.findAll('tr').at(1).findAll('button').at(0).trigger('click')
      })

      it('toasts an error message', () => {
        expect(toastErrorSpy).toBeCalledWith('Ouchhh!')
      })
    })

    describe('confirm creation with success', () => {
      beforeEach(async () => {
        apolloMutateMock.mockResolvedValue({})
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
            expect(apolloMutateMock).toBeCalledWith({
              mutation: confirmContribution,
              variables: { id: 2 },
            })
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
            apolloMutateMock.mockRejectedValue({ message: 'Ouchhh!' })
            await wrapper.find('#overlay').findAll('button').at(1).trigger('click')
          })

          it('toasts an error message', () => {
            expect(toastErrorSpy).toBeCalledWith('Ouchhh!')
          })
        })
      })
    })

    describe('server response for get pending creations is error', () => {
      beforeEach(() => {
        jest.clearAllMocks()
        apolloQueryMock.mockRejectedValue({
          message: 'Ouch!',
        })
        wrapper = Wrapper()
      })

      it('toast an error message', () => {
        expect(toastErrorSpy).toBeCalledWith('Ouch!')
      })
    })
  })
})
