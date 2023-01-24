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
      describe('button', () => {
        it('has submit disabled', () => {
          expect(wrapper.find('button[data-test="button-submit"]').attributes('disabled')).toBe(
            'disabled',
          )
        })
      })
    })

    describe('dates', () => {
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

      describe('actual date', () => {
        describe('same month', () => {
          beforeEach(async () => {
            const now = new Date().toISOString()
            await wrapper.findComponent({ name: 'BFormDatepicker' }).vm.$emit('input', now)
          })

          describe('isThisMonth', () => {
            it('has true', () => {
              expect(wrapper.vm.isThisMonth).toBe(true)
            })
          })
        })

        describe.skip('month before', () => {
          beforeEach(async () => {
            await wrapper
              .findComponent({ name: 'BFormDatepicker' })
              .vm.$emit('input', wrapper.vm.minimalDate)
          })

          describe('isThisMonth', () => {
            it('has false', () => {
              expect(wrapper.vm.isThisMonth).toBe(false)
            })
          })
        })
      })

      describe.skip('date in middle of year', () => {
        describe('same month', () => {
          beforeEach(async () => {
            // jest.useFakeTimers('modern')
            // jest.setSystemTime(new Date('2020-07-06'))
            // await wrapper.findComponent({ name: 'BFormDatepicker' }).vm.$emit('input', now)
            await wrapper.setData({
              maximalDate: new Date(2020, 6, 6),
              form: { date: new Date(2020, 6, 6) },
            })
          })

          describe('minimalDate', () => {
            it('has "2020-06-01T00:00:00.000Z"', () => {
              expect(wrapper.vm.minimalDate.toISOString()).toBe('2020-06-01T00:00:00.000Z')
            })
          })

          describe('isThisMonth', () => {
            it('has true', () => {
              expect(wrapper.vm.isThisMonth).toBe(true)
            })
          })
        })

        describe('month before', () => {
          beforeEach(async () => {
            // jest.useFakeTimers('modern')
            // jest.setSystemTime(new Date('2020-07-06'))
            // console.log('middle of year date – now:', wrapper.vm.minimalDate)
            // await wrapper
            //   .findComponent({ name: 'BFormDatepicker' })
            //   .vm.$emit('input', wrapper.vm.minimalDate)
            await wrapper.setData({
              maximalDate: new Date(2020, 6, 6),
              form: { date: new Date(2020, 5, 6) },
            })
          })

          describe('minimalDate', () => {
            it('has "2020-06-01T00:00:00.000Z"', () => {
              expect(wrapper.vm.minimalDate.toISOString()).toBe('2020-06-01T00:00:00.000Z')
            })
          })

          describe('isThisMonth', () => {
            it('has false', () => {
              expect(wrapper.vm.isThisMonth).toBe(false)
            })
          })
        })
      })

      describe.skip('date in january', () => {
        describe('same month', () => {
          beforeEach(async () => {
            await wrapper.setData({
              maximalDate: new Date(2020, 0, 6),
              form: { date: new Date(2020, 0, 6) },
            })
          })

          describe('minimalDate', () => {
            it('has "2019-12-01T00:00:00.000Z"', () => {
              expect(wrapper.vm.minimalDate.toISOString()).toBe('2019-12-01T00:00:00.000Z')
            })
          })

          describe('isThisMonth', () => {
            it('has true', () => {
              expect(wrapper.vm.isThisMonth).toBe(true)
            })
          })
        })

        describe('month before', () => {
          beforeEach(async () => {
            // jest.useFakeTimers('modern')
            // jest.setSystemTime(new Date('2020-07-06'))
            // console.log('middle of year date – now:', wrapper.vm.minimalDate)
            // await wrapper
            //   .findComponent({ name: 'BFormDatepicker' })
            //   .vm.$emit('input', wrapper.vm.minimalDate)
            await wrapper.setData({
              maximalDate: new Date(2020, 0, 6),
              form: { date: new Date(2019, 11, 6) },
            })
          })

          describe('minimalDate', () => {
            it('has "2019-12-01T00:00:00.000Z"', () => {
              expect(wrapper.vm.minimalDate.toISOString()).toBe('2019-12-01T00:00:00.000Z')
            })
          })

          describe('isThisMonth', () => {
            it('has false', () => {
              expect(wrapper.vm.isThisMonth).toBe(false)
            })
          })
        })
      })

      describe.skip('date with the 31st day of the month', () => {
        describe('same month', () => {
          beforeEach(async () => {
            await wrapper.setData({
              maximalDate: new Date('2022-10-31T00:00:00.000Z'),
              form: { date: new Date('2022-10-31T00:00:00.000Z') },
            })
          })

          describe('minimalDate', () => {
            it('has "2022-09-01T00:00:00.000Z"', () => {
              expect(wrapper.vm.minimalDate.toISOString()).toBe('2022-09-01T00:00:00.000Z')
            })
          })

          describe('isThisMonth', () => {
            it('has true', () => {
              expect(wrapper.vm.isThisMonth).toBe(true)
            })
          })
        })
      })

      describe.skip('date with the 28th day of the month', () => {
        describe('same month', () => {
          beforeEach(async () => {
            await wrapper.setData({
              maximalDate: new Date('2023-02-28T00:00:00.000Z'),
              form: { date: new Date('2023-02-28T00:00:00.000Z') },
            })
          })

          describe('minimalDate', () => {
            it('has "2023-01-01T00:00:00.000Z"', () => {
              expect(wrapper.vm.minimalDate.toISOString()).toBe('2023-01-01T00:00:00.000Z')
            })
          })

          describe('isThisMonth', () => {
            it('has true', () => {
              expect(wrapper.vm.isThisMonth).toBe(true)
            })
          })
        })
      })

      describe.skip('date with 29.02.2024 leap year', () => {
        describe('same month', () => {
          beforeEach(async () => {
            await wrapper.setData({
              maximalDate: new Date('2024-02-29T00:00:00.000Z'),
              form: { date: new Date('2024-02-29T00:00:00.000Z') },
            })
          })

          describe('minimalDate', () => {
            it('has "2024-01-01T00:00:00.000Z"', () => {
              expect(wrapper.vm.minimalDate.toISOString()).toBe('2024-01-01T00:00:00.000Z')
            })
          })

          describe('isThisMonth', () => {
            it('has true', () => {
              expect(wrapper.vm.isThisMonth).toBe(true)
            })
          })
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

          describe.skip('on trigger submit', () => {
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
})
