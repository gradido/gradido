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
          expect(
            wrapper.find('button[data-test="button-cancel"]').attributes('disabled'),
          ).toBeFalsy()
        })

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

        describe('month before', () => {
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

      // jest-environment-jsdom-sixteen
      // testEnvironment: 'jest-environment-jsdom-sixteen',
      // https://www.npmjs.com/package/jest-environment-jsdom-sixteen
      // https://dev.to/philw_/problems-with-using-usefaketimersmodern-in-a-create-react-app-cra-project-with-jest-26-and-lodashs-debounce-function-3ohd
      describe.skip('date in middle of year', () => {
        describe('same month', () => {
          beforeEach(async () => {
            jest.useFakeTimers('modern')
            jest.setSystemTime(new Date('2020-07-06'))
            const now = new Date().toISOString()
            // Wolle: console.log('middle of year date – now:', now)
            await wrapper.findComponent({ name: 'BFormDatepicker' }).vm.$emit('input', now)
          })

          describe('isThisMonth', () => {
            it('has true', () => {
              expect(wrapper.vm.isThisMonth).toBe(true)
            })
          })
        })

        describe('month before', () => {
          beforeEach(async () => {
            // Wolle: console.log('middle of year date – now:', wrapper.vm.minimalDate)
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

      describe.skip('date in january', () => {
        describe('same month', () => {
          beforeEach(async () => {
            jest.useFakeTimers('modern').setSystemTime(new Date('2020-01-12'))
            const now = new Date().toISOString()
            // Wolle: console.log('in january date – now:', now)
            await wrapper.findComponent({ name: 'BFormDatepicker' }).vm.$emit('input', now)
          })

          describe('isThisMonth', () => {
            it('has true', () => {
              expect(wrapper.vm.isThisMonth).toBe(true)
            })
          })
        })

        describe('month before', () => {
          beforeEach(async () => {
            // Wolle: console.log('in january date – wrapper.vm.minimalDate:', wrapper.vm.minimalDate)
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

            describe('buttons', () => {
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

            describe('buttons', () => {
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

          describe('buttons', () => {
            describe('reset', () => {
              it('has enabled', () => {
                expect(
                  wrapper.find('button[data-test="button-cancel"]').attributes('disabled'),
                ).toBeFalsy()
              })
            })

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
            await wrapper.findComponent({ name: 'BFormDatepicker' }).vm.$emit('input', now)
            await wrapper.find('#contribution-amount').find('input').setValue('200')
          })

          describe('memo lenght < 5, others are valid', () => {
            beforeEach(async () => {
              await wrapper.find('#contribution-memo').find('textarea').setValue('1234')
            })

            describe('buttons', () => {
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

            describe('buttons', () => {
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

          describe('buttons', () => {
            describe('reset', () => {
              it('has enabled', () => {
                expect(
                  wrapper.find('button[data-test="button-cancel"]').attributes('disabled'),
                ).toBeFalsy()
              })
            })

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
