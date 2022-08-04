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
          expect(
            wrapper.find('button[data-test="button-cancel"]').attributes('disabled'),
          ).toBeFalsy()
        })

        it('submit disabled', () => {
          expect(wrapper.find('button[data-test="button-submit"]').attributes('disabled')).toBe(
            'disabled',
          )
        })
      })
    })

    describe('set contrubtion', () => {
      describe('fill in form data with "id === null"', () => {
        const now = new Date().toISOString()

        beforeEach(async () => {
          await wrapper.findComponent({ name: 'BFormDatepicker' }).vm.$emit('input', now)
          await wrapper
            .find('#contribution-memo')
            .find('textarea')
            .setValue('Mein Beitrag zur Gemeinschaft für diesen Monat ...')
          await wrapper.find('#contribution-amount').find('input').setValue('200')
        })

        describe('has button', () => {
          describe('reset', () => {
            it('enabled', () => {
              expect(
                wrapper.find('button[data-test="button-cancel"]').attributes('disabled'),
              ).toBeFalsy()
            })
          })

          describe('submit', () => {
            it('enabled', () => {
              expect(
                wrapper.find('button[data-test="button-submit"]').attributes('disabled'),
              ).toBeFalsy()
            })

            it('labeled with "contribution.submit"', () => {
              expect(wrapper.find('button[data-test="button-submit"]').text()).toContain(
                'contribution.submit',
              )
            })
          })
        })

        describe('on trigger submit', () => {
          beforeEach(async () => {
            await wrapper.find('form').trigger('submit')
          })

          it('emits "set-contribution"', () => {
            expect(wrapper.emitted('set-contribution')).toEqual(
              expect.arrayContaining([
                expect.arrayContaining([
                  {
                    id: null,
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

    describe('update contrubtion', () => {
      describe('fill in form data with set "id"', () => {
        const now = new Date().toISOString()

        beforeEach(async () => {
          wrapper = Wrapper()
          await wrapper.setData({
            form: {
              id: 2,
              date: now,
              memo: 'Mein kommerzieller Beitrag für diesen Monat ...',
              amount: '100',
            },
          })
          await wrapper.findComponent({ name: 'BFormDatepicker' }).vm.$emit('input', now)
          await wrapper
            .find('#contribution-memo')
            .find('textarea')
            .setValue('Mein Beitrag zur Gemeinschaft für diesen Monat ...')
          await wrapper.find('#contribution-amount').find('input').setValue('200')
        })

        describe('has button', () => {
          describe('reset', () => {
            it('enabled', () => {
              expect(
                wrapper.find('button[data-test="button-cancel"]').attributes('disabled'),
              ).toBeFalsy()
            })
          })

          describe('submit', () => {
            it('enabled', () => {
              expect(
                wrapper.find('button[data-test="button-submit"]').attributes('disabled'),
              ).toBeFalsy()
            })

            it('labeled with "form.change"', () => {
              expect(wrapper.find('button[data-test="button-submit"]').text()).toContain(
                'form.change',
              )
            })
          })
        })

        describe('on trigger submit', () => {
          beforeEach(async () => {
            await wrapper.find('form').trigger('submit')
          })

          it('emits "update-contribution"', () => {
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
