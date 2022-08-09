import { mount } from '@vue/test-utils'
import ContributionForm from './ContributionForm.vue'

const localVue = global.localVue

describe('ContributionForm', () => {
  let wrapper

  const propsData = {
    value: {
      id: null,
      date: '',
      memo: '',
      amount: '',
    },
  }

  const mocks = {
    $t: jest.fn((t) => t),
    $d: jest.fn((d) => d),
    $store: {
      state: {
        creation: ['1000', '1000', '1000'],
      },
    },
    $i18n: {
      locale: 'en',
    },
  }

  const Wrapper = () => {
    return mount(ContributionForm, {
      localVue,
      mocks,
      propsData,
    })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('has a DIV .contribution-form', () => {
      expect(wrapper.find('div.contribution-form').exists()).toBe(true)
    })

    describe('empty form data', () => {
      describe('buttons', () => {
        it('has reset enabled', () => {
          expect(wrapper.find('button[type="reset"]').attributes('disabled')).toBeFalsy()
        })

        it('has submit disabled', () => {
          expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBe('disabled')
        })
      })
    })

    describe('set contrubtion', () => {
      describe('fill in form data', () => {
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
        })

        describe('buttons', () => {
          it('has reset enabled', () => {
            expect(wrapper.find('button[type="reset"]').attributes('disabled')).toBeFalsy()
          })

          it('has submit enabled', () => {
            expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeFalsy()
          })
        })
      })
    })

    describe('update contrubtion', () => {
      describe('fill in form data and "id"', () => {
        const now = new Date().toISOString()

        beforeEach(async () => {
          await wrapper.setData({
            form: {
              id: 2,
              date: now,
              memo: 'Mein Beitrag zur Gemeinschaft für diesen Monat ...',
              amount: '200',
            },
          })
        })

        describe('buttons', () => {
          it('has reset enabled', () => {
            expect(wrapper.find('button[type="reset"]').attributes('disabled')).toBeFalsy()
          })

          it('has submit enabled', () => {
            expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeFalsy()
          })
        })
      })
    })
  })
})
