import { mount } from '@vue/test-utils'
import ContributionLinkForm from './ContributionLinkForm.vue'
import { toastErrorSpy } from '../../test/testSetup'

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

    // describe('successfull submit', () => {
    //   beforeEach(async () => {
    //     mockAPIcall.mockResolvedValue({
    //       data: {
    //         createContributionLink: {
    //           link: 'https://localhost/redeem/CL-1a2345678',
    //         },
    //       },
    //     })
    //     await wrapper.find('input.test-validFrom').setValue('2022-6-18')
    //     await wrapper.find('input.test-validTo').setValue('2022-7-18')
    //     await wrapper.find('input.test-name').setValue('test name')
    //     await wrapper.find('input.test-memo').setValue('test memo')
    //     await wrapper.find('input.test-amount').setValue('100')
    //     await wrapper.find('form').trigger('submit')
    //   })

    //   it('calls the API', () => {
    //     expect(mockAPIcall).toHaveBeenCalledWith(
    //       expect.objectContaining({
    //         variables: {
    //           link: 'https://localhost/redeem/CL-1a2345678',
    //         },
    //       }),
    //     )
    //   })

    //   it('displays the new username', () => {
    //     expect(wrapper.find('div.display-username').text()).toEqual('@username')
    //   })
    // })
  })

  describe('send createContributionLink with error', () => {
    beforeEach(() => {
      apolloMutateMock.mockRejectedValue({ message: 'OUCH!' })
      wrapper = Wrapper()
      wrapper.vm.onSubmit()
    })

    it('toasts an error message', () => {
      expect(toastErrorSpy).toBeCalledWith('contributionLink.noStartDate')
    })
  })
})
