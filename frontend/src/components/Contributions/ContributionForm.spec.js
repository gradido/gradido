import { mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
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
      describe('has button', () => {
        it('reset enabled', () => {
          expect(wrapper.find('button[type="reset"]').attributes('disabled')).toBeFalsy()
        })

        it('submit disabled', () => {
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

        describe('has button', () => {
          it('reset enabled', () => {
            expect(wrapper.find('button[type="reset"]').attributes('disabled')).toBeFalsy()
          })

          it('submit enabled', () => {
            expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeFalsy()
          })
        })

        describe.skip('on trigger submit', () => {
          beforeEach(async () => {
            // await wrapper.find('.test-submit').trigger('click')
            await wrapper.find('button[type="submit"]').trigger('click')
          })

          it('emits "set-contribution"', () => {
            expect(wrapper.emitted('set-contribution')).toEqual({
              id: null,
              date: now,
              memo: 'Mein Beitrag zur Gemeinschaft für diesen Monat ...',
              amount: '200',
            })
          })
        })
      })
    })

    describe('update contrubtion', () => {
      describe('fill in form data and "id"', () => {
        const now = new Date().toISOString()

        beforeEach(async () => {
          wrapper = Wrapper()
          await wrapper.findComponent({ name: 'BFormDatepicker' }).vm.$emit('input', now)
          await wrapper
            .find('#contribution-memo')
            .find('textarea')
            .setValue('Mein Beitrag zur Gemeinschaft für diesen Monat ...')
          await wrapper.find('#contribution-amount').find('input').setValue('200')
        })

        describe('has button', () => {
          it('reset enabled', () => {
            expect(
              wrapper.find('button[data-test="button-cancel"]').attributes('disabled'),
            ).toBeFalsy()
          })

          it('submit enabled', () => {
            expect(
              wrapper.find('button[data-test="button-submit"]').attributes('disabled'),
            ).toBeFalsy()
          })
        })

        describe('on trigger submit', () => {
          beforeEach(async () => {
            // await wrapper.find('.test-submit').trigger('click')
            // await wrapper.find('button[type="submit"]').trigger('click')
            await wrapper.find('form').trigger('submit')
            await flushPromises()
            // Wolle:
            await wrapper.vm.$nextTick()
          })

          it.only('emits "update-contribution"', () => {
            expect(wrapper.emitted('update-contribution')).toEqual(
              expect.arrayContaining([
                expect.arrayContaining([
                  {
                    id: 2,
                    date: now,
                    memo: 'Mein Beitrag zur Gemeinschaft für diesen Monat ...',
                    amount: '200',
                  },
                ]),
              ]),
            )
          })
        })
      })
    })
  })
})
