import { mount } from '@vue/test-utils'
import ContributionLinkForm from './ContributionLinkForm.vue'
import { toastErrorSpy, toastSuccessSpy } from '../../../test/testSetup'
import { createContributionLink } from '@/graphql/createContributionLink.js'

const localVue = global.localVue

global.alert = jest.fn()

const propsData = {
  contributionLinkData: {},
}
const apolloMutateMock = jest.fn().mockResolvedValue()

const mocks = {
  $t: jest.fn((t) => t),
  $apollo: {
    mutate: apolloMutateMock,
  },
}

// const mockAPIcall = jest.fn()

describe('ContributionLinkForm', () => {
  let wrapper

  const Wrapper = () => {
    return mount(ContributionLinkForm, { localVue, mocks, propsData })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the Div Element ".contribution-link-form"', () => {
      expect(wrapper.find('div.contribution-link-form').exists()).toBe(true)
    })

    describe('call onReset', () => {
      it('form has the set data', () => {
        beforeEach(() => {
          wrapper.setData({
            form: {
              name: 'name',
              memo: 'memo',
              amount: 100,
              validFrom: 'validFrom',
              validTo: 'validTo',
              cycle: 'ONCE',
              maxPerCycle: 1,
              maxAmountPerMonth: 100,
            },
          })
          wrapper.vm.onReset()
        })
        expect(wrapper.vm.form).toEqual({
          amount: null,
          cycle: 'ONCE',
          validTo: null,
          maxAmountPerMonth: '0',
          memo: null,
          name: null,
          maxPerCycle: 1,
          validFrom: null,
        })
      })
    })

    describe('call onSubmit', () => {
      it('response with the contribution link url', () => {
        wrapper.vm.onSubmit()
      })
    })

    describe('successfull submit', () => {
      beforeEach(async () => {
        apolloMutateMock.mockResolvedValue({
          data: {
            createContributionLink: {
              link: 'https://localhost/redeem/CL-1a2345678',
            },
          },
        })
        await wrapper
          .findAllComponents({ name: 'BFormDatepicker' })
          .at(0)
          .vm.$emit('input', '2022-6-18')
        await wrapper
          .findAllComponents({ name: 'BFormDatepicker' })
          .at(1)
          .vm.$emit('input', '2022-7-18')
        await wrapper.find('input.test-name').setValue('test name')
        await wrapper.find('textarea.test-memo').setValue('test memo')
        await wrapper.find('input.test-amount').setValue('100')
        await wrapper.find('form').trigger('submit')
      })

      it('calls the API', () => {
        expect(apolloMutateMock).toHaveBeenCalledWith({
          mutation: createContributionLink,
          variables: {
            validFrom: '2022-6-18',
            validTo: '2022-7-18',
            name: 'test name',
            amount: '100',
            memo: 'test memo',
            cycle: 'ONCE',
            maxPerCycle: 1,
            maxAmountPerMonth: '0',
          },
        })
      })

      it('toasts a succes message', () => {
        expect(toastSuccessSpy).toBeCalledWith('https://localhost/redeem/CL-1a2345678')
      })
    })

    describe('send createContributionLink with error', () => {
      beforeEach(async () => {
        apolloMutateMock.mockRejectedValue({ message: 'OUCH!' })
        await wrapper
          .findAllComponents({ name: 'BFormDatepicker' })
          .at(0)
          .vm.$emit('input', '2022-6-18')
        await wrapper
          .findAllComponents({ name: 'BFormDatepicker' })
          .at(1)
          .vm.$emit('input', '2022-7-18')
        await wrapper.find('input.test-name').setValue('test name')
        await wrapper.find('textarea.test-memo').setValue('test memo')
        await wrapper.find('input.test-amount').setValue('100')
        await wrapper.find('form').trigger('submit')
      })

      it('toasts an error message', () => {
        expect(toastErrorSpy).toBeCalledWith('OUCH!')
      })
    })
  })
})
