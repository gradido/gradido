import { mount } from '@vue/test-utils'
import ContributionListItem from './ContributionListItem.vue'

const localVue = global.localVue

describe('ContributionListItem', () => {
  let wrapper

  const mocks = {
    $t: jest.fn((t) => t),
    $d: jest.fn((d) => d),
    $apollo: { query: jest.fn().mockResolvedValue() },
  }

  const propsData = {
    contributionId: 42,
    state: 'PENDING',
    messagesCount: 2,
    id: 1,
    createdAt: '26/07/2022',
    contributionDate: '07/06/2022',
    memo: 'Ich habe 10 Stunden die Elbwiesen von Müll befreit.',
    amount: '200',
  }

  const Wrapper = () => {
    return mount(ContributionListItem, {
      localVue,
      mocks,
      propsData,
    })
  }

  describe('mount', () => {
    beforeEach(() => {
      jest.clearAllMocks()
      wrapper = Wrapper()
    })

    it('has a DIV .contribution-list-item', () => {
      expect(wrapper.find('div.contribution-list-item').exists()).toBe(true)
    })

    describe('contribution icon', () => {
      it('is bell-fill by default', () => {
        expect(wrapper.vm.icon).toBe('bell-fill')
      })

      it('is x-circle when deletedAt is present', async () => {
        await wrapper.setProps({ deletedAt: new Date().toISOString() })
        expect(wrapper.vm.icon).toBe('trash')
      })

      it('is check when confirmedAt is present', async () => {
        await wrapper.setProps({ confirmedAt: new Date().toISOString() })
        expect(wrapper.vm.icon).toBe('check')
      })
    })

    describe('contribution variant', () => {
      it('is primary by default', () => {
        expect(wrapper.vm.variant).toBe('primary')
      })

      it('is danger when deletedAt is present', async () => {
        await wrapper.setProps({ deletedAt: new Date().toISOString() })
        expect(wrapper.vm.variant).toBe('danger')
      })

      it('is success at when confirmedAt is present', async () => {
        await wrapper.setProps({ confirmedAt: new Date().toISOString() })
        expect(wrapper.vm.variant).toBe('success')
      })

      it('is warning at when state is IN_PROGRESS', async () => {
        await wrapper.setProps({ state: 'IN_PROGRESS' })
        expect(wrapper.vm.variant).toBe('205')
      })
    })

    describe('date', () => {
      it('is equal to createdAt', () => {
        expect(wrapper.vm.date).toBe(wrapper.vm.createdAt)
      })
    })

    describe('delete contribution', () => {
      let spy

      describe('edit contribution', () => {
        beforeEach(() => {
          wrapper.find('div.test-edit-contribution').trigger('click')
        })

        it('emits update contribution form', () => {
          expect(wrapper.emitted('update-contribution-form')).toEqual([
            [
              {
                id: 1,
                contributionDate: '07/06/2022',
                memo: 'Ich habe 10 Stunden die Elbwiesen von Müll befreit.',
                amount: '200',
              },
            ],
          ])
        })
      })

      describe('confirm deletion', () => {
        beforeEach(() => {
          spy = jest.spyOn(wrapper.vm.$bvModal, 'msgBoxConfirm')
          spy.mockImplementation(() => Promise.resolve(true))
          wrapper.find('div.test-delete-contribution').trigger('click')
        })

        it('opens the modal', () => {
          expect(spy).toBeCalledWith('contribution.delete')
        })

        it('emits delete contribution', () => {
          expect(wrapper.emitted('delete-contribution')).toEqual([[{ id: 1 }]])
        })
      })

      describe('cancel deletion', () => {
        beforeEach(async () => {
          spy = jest.spyOn(wrapper.vm.$bvModal, 'msgBoxConfirm')
          spy.mockImplementation(() => Promise.resolve(false))
          await wrapper.findAll('div.pointer').at(2).trigger('click')
        })

        it('does not emit delete contribution', () => {
          expect(wrapper.emitted('delete-contribution')).toBeFalsy()
        })
      })

      describe('updateState', () => {
        beforeEach(async () => {
          await wrapper.vm.updateState()
        })

        it('emit update-state', () => {
          expect(wrapper.vm.$emit('update-state')).toBeTruthy()
        })
      })
    })

    describe('getListContributionMessages', () => {
      beforeEach(() => {
        wrapper
          .findComponent({ name: 'ContributionMessagesList' })
          .vm.$emit('get-list-contribution-messages')
      })
      it('emits closeAllOpenCollapse', () => {
        expect(wrapper.emitted('closeAllOpenCollapse')).toBeTruthy()
      })
    })
  })
})
