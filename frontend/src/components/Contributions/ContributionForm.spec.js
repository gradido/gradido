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
      hours: 0,
    },
    isThisMonth: true,
    minimalDate: new Date(),
    maxGddLastMonth: 1000,
    maxGddThisMonth: 1000,
  }

  const mocks = {
    $t: jest.fn((t) => t),
    $d: jest.fn((d) => d),
    $n: jest.fn((n) => n),
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
      describe('button', () => {
        it('has submit disabled', () => {
          expect(wrapper.find('button[data-test="button-submit"]').attributes('disabled')).toBe(
            'disabled',
          )
        })
      })
    })

    describe('dates and max amounts', () => {
      beforeEach(async () => {
        await wrapper.setData({
          form: {
            id: null,
            date: '',
            memo: '',
            amount: '',
          },
        })
      })

      describe('max amount reached for both months', () => {
        beforeEach(() => {
          wrapper.setProps({
            maxGddLastMonth: 0,
            maxGddThisMonth: 0,
          })
          wrapper.setData({
            form: {
              id: null,
              date: 'set',
              memo: '',
              amount: '',
            },
          })
        })

        it('shows message that no contributions are available', () => {
          expect(wrapper.find('[data-test="contribtion-message"]').text()).toBe(
            'contribution.noOpenCreation.allMonth',
          )
        })
      })

      describe('max amount reached for last month, no date selected', () => {
        beforeEach(() => {
          wrapper.setProps({
            maxGddLastMonth: 0,
          })
        })

        it('shows no message', () => {
          expect(wrapper.find('[data-test="contribtion-message"]').exists()).toBe(false)
        })
      })

      describe('max amount reached for last month, last month selected', () => {
        beforeEach(async () => {
          wrapper.setProps({
            maxGddLastMonth: 0,
            isThisMonth: false,
          })
          await wrapper.setData({
            form: {
              id: null,
              date: 'set',
              memo: '',
              amount: '',
            },
          })
        })

        it('shows message that no contributions are available for last month', () => {
          expect(wrapper.find('[data-test="contribtion-message"]').text()).toBe(
            'contribution.noOpenCreation.lastMonth',
          )
        })
      })

      describe('max amount reached for last month, this month selected', () => {
        beforeEach(async () => {
          wrapper.setProps({
            maxGddLastMonth: 0,
            isThisMonth: true,
          })
          await wrapper.setData({
            form: {
              id: null,
              date: 'set',
              memo: '',
              amount: '',
            },
          })
        })

        it('shows no message', () => {
          expect(wrapper.find('[data-test="contribtion-message"]').exists()).toBe(false)
        })
      })

      describe('max amount reached for this month, no date selected', () => {
        beforeEach(() => {
          wrapper.setProps({
            maxGddThisMonth: 0,
          })
        })

        it('shows no message', () => {
          expect(wrapper.find('[data-test="contribtion-message"]').exists()).toBe(false)
        })
      })

      describe('max amount reached for this month, this month selected', () => {
        beforeEach(async () => {
          wrapper.setProps({
            maxGddThisMonth: 0,
            isThisMonth: true,
          })
          await wrapper.setData({
            form: {
              id: null,
              date: 'set',
              memo: '',
              amount: '',
            },
          })
        })

        it('shows message that no contributions are available for last month', () => {
          expect(wrapper.find('[data-test="contribtion-message"]').text()).toBe(
            'contribution.noOpenCreation.thisMonth',
          )
        })
      })

      describe('max amount reached for this month, last month selected', () => {
        beforeEach(async () => {
          wrapper.setProps({
            maxGddThisMonth: 0,
            isThisMonth: false,
          })
          await wrapper.setData({
            form: {
              id: null,
              date: 'set',
              memo: '',
              amount: '',
            },
          })
        })

        it('shows no message', () => {
          expect(wrapper.find('[data-test="contribtion-message"]').exists()).toBe(false)
        })
      })
    })

    describe('default return message', () => {
      it('returns an empty string', () => {
        expect(wrapper.vm.noOpenCreation).toBe('')
      })
    })

    describe('update amount', () => {
      beforeEach(() => {
        wrapper.findComponent({ name: 'InputHour' }).vm.$emit('updateAmount', 20)
      })

      it('updates form amount', () => {
        expect(wrapper.vm.form.amount).toBe('400.00')
      })
    })

    describe('watch value', () => {
      beforeEach(() => {
        wrapper.setProps({
          value: {
            id: 42,
            date: 'set',
            memo: 'Some Memo',
            amount: '400.00',
          },
        })
      })

      it('updates form', () => {
        expect(wrapper.vm.form).toEqual({
          id: 42,
          date: 'set',
          memo: 'Some Memo',
          amount: '400.00',
        })
      })
    })

    describe('set contrubtion', () => {
      describe('fill in form data with "id === null"', () => {
        const now = new Date().toISOString()

        beforeEach(async () => {
          await wrapper.setData({
            form: {
              id: null,
              date: '',
              memo: '',
              amount: '',
            },
          })
        })

        describe('invalid form data', () => {
          beforeEach(async () => {
            await wrapper.findComponent({ name: 'BFormDatepicker' }).vm.$emit('input', now)
            await wrapper.find('#contribution-amount').find('input').setValue('200')
          })

          describe('memo lenght < 5, others are valid', () => {
            beforeEach(async () => {
              await wrapper.find('#contribution-memo').find('textarea').setValue('1234')
            })

            describe('button', () => {
              describe('submit', () => {
                it('has disabled', () => {
                  expect(
                    wrapper.find('button[data-test="button-submit"]').attributes('disabled'),
                  ).toBe('disabled')
                })
              })
            })
          })

          describe('memo lenght > 255, others are valid', () => {
            beforeEach(async () => {
              await wrapper
                .find('#contribution-memo')
                .find('textarea')
                .setValue(
                  '0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789' +
                    '0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789' +
                    '01234567890123456789012345678901234567890123456789012345',
                )
              await wrapper.vm.$nextTick()
            })

            describe('button', () => {
              describe('submit', () => {
                it('has disabled', () => {
                  expect(
                    wrapper.find('button[data-test="button-submit"]').attributes('disabled'),
                  ).toBe('disabled')
                })
              })
            })
          })
        })

        describe('valid form data', () => {
          beforeEach(async () => {
            await wrapper.findComponent({ name: 'BFormDatepicker' }).vm.$emit('input', now)
            await wrapper
              .find('#contribution-memo')
              .find('textarea')
              .setValue('Mein Beitrag zur Gemeinschaft für diesen Monat ...')
            await wrapper.find('#contribution-amount').find('input').setValue('200')
          })

          describe('button', () => {
            describe('submit', () => {
              it('has enabled', () => {
                expect(
                  wrapper.find('button[data-test="button-submit"]').attributes('disabled'),
                ).toBeFalsy()
              })

              it('has label "contribution.submit"', () => {
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
                      hours: 0,
                    },
                  ]),
                ]),
              )
            })
          })
        })
      })
    })

    describe('update contrubtion', () => {
      describe('fill in form data with set "id"', () => {
        const now = new Date().toISOString()

        beforeEach(async () => {
          await wrapper.setData({
            form: {
              id: 2,
              date: now,
              memo: 'Mein kommerzieller Beitrag für diesen Monat ...',
              amount: '100',
            },
          })
        })

        describe('invalid form data', () => {
          beforeEach(async () => {
            // skip this precondition as long as the datepicker is disabled in the component
            // await wrapper.findComponent({ name: 'BFormDatepicker' }).vm.$emit('input', now)
            await wrapper.find('#contribution-amount').find('input').setValue('200')
          })

          describe('memo lenght < 5, others are valid', () => {
            beforeEach(async () => {
              await wrapper.find('#contribution-memo').find('textarea').setValue('1234')
            })

            describe('button', () => {
              describe('submit', () => {
                it('has disabled', () => {
                  expect(
                    wrapper.find('button[data-test="button-submit"]').attributes('disabled'),
                  ).toBe('disabled')
                })
              })
            })
          })

          describe('memo lenght > 255, others are valid', () => {
            beforeEach(async () => {
              await wrapper
                .find('#contribution-memo')
                .find('textarea')
                .setValue(
                  '0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789' +
                    '0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789' +
                    '01234567890123456789012345678901234567890123456789012345',
                )
              await wrapper.vm.$nextTick()
            })

            describe('button', () => {
              describe('submit', () => {
                it('has disabled', () => {
                  expect(
                    wrapper.find('button[data-test="button-submit"]').attributes('disabled'),
                  ).toBe('disabled')
                })
              })
            })
          })
        })

        describe('valid form data', () => {
          beforeEach(async () => {
            await wrapper.findComponent({ name: 'BFormDatepicker' }).vm.$emit('input', now)
            await wrapper
              .find('#contribution-memo')
              .find('textarea')
              .setValue('Mein Beitrag zur Gemeinschaft für diesen Monat ...')
            await wrapper.find('#contribution-amount').find('input').setValue('200')
          })

          describe('button', () => {
            describe('submit', () => {
              it('has enabled', () => {
                expect(
                  wrapper.find('button[data-test="button-submit"]').attributes('disabled'),
                ).toBeFalsy()
              })

              it('has label "form.change"', () => {
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
              expect(wrapper.emitted('update-contribution')).toEqual([
                [
                  {
                    id: 2,
                    date: now,
                    hours: 0,
                    memo: 'Mein Beitrag zur Gemeinschaft für diesen Monat ...',
                    amount: '200',
                  },
                ],
              ])
            })
          })
        })
      })
    })
  })
})
