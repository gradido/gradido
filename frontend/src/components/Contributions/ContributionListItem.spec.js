import { mount } from '@vue/test-utils'
import ContributionListItem from './ContributionListItem.vue'

const localVue = global.localVue

describe('ContributionListItem', () => {
  let wrapper

  const mocks = {
    $t: jest.fn((t) => t),
    $d: jest.fn((d) => d),
  }

  const propsData = {
    id: 1,
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

    describe('contribution type', () => {
      it('is pending by default', () => {
        expect(wrapper.vm.type).toBe('pending')
      })

      it('is deleted when deletedAt is present', async () => {
        await wrapper.setProps({ deletedAt: new Date().toISOString() })
        expect(wrapper.vm.type).toBe('deleted')
      })

      it('is confirmed when confirmedAt is present', async () => {
        await wrapper.setProps({ confirmedAt: new Date().toISOString() })
        expect(wrapper.vm.type).toBe('confirmed')
      })
    })

    describe('contribution icon', () => {
      it('is bell-fill by default', () => {
        expect(wrapper.vm.icon).toBe('bell-fill')
      })

      it('is x-circle when deletedAt is present', async () => {
        await wrapper.setProps({ deletedAt: new Date().toISOString() })
        expect(wrapper.vm.icon).toBe('x-circle')
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
    })

    describe('contribution date', () => {
      it('is contributionDate by default', () => {
        expect(wrapper.vm.date).toBe(wrapper.vm.contributionDate)
      })

      it('is deletedAt when deletedAt is present', async () => {
        const now = new Date().toISOString()
        await wrapper.setProps({ deletedAt: now })
        expect(wrapper.vm.date).toBe(now)
      })

      it('is confirmedAt at when confirmedAt is present', async () => {
        const now = new Date().toISOString()
        await wrapper.setProps({ confirmedAt: now })
        expect(wrapper.vm.date).toBe(now)
      })
    })

    describe('delete contribution', () => {
      let spy

      describe('edit contribution', () => {
        beforeEach(() => {
          wrapper.findAll('div.pointer').at(0).trigger('click')
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
          wrapper.findAll('div.pointer').at(1).trigger('click')
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
          await wrapper.findAll('div.pointer').at(1).trigger('click')
        })

        it('does not emit delete contribution', () => {
          expect(wrapper.emitted('delete-contribution')).toBeFalsy()
        })
      })
    })
  })
})
