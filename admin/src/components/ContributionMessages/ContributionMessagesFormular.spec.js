import { mount } from '@vue/test-utils'
import ContributionMessagesFormular from './ContributionMessagesFormular'
import { toastErrorSpy, toastSuccessSpy } from '../../../test/testSetup'
import { adminCreateContributionMessage } from '@/graphql/adminCreateContributionMessage'
import { adminUpdateContribution } from '@/graphql/adminUpdateContribution'
import { vi, describe, beforeEach, it, expect } from 'vitest'

const localVue = global.localVue

const apolloMutateMock = vi.fn().mockResolvedValue()

describe('ContributionMessagesFormular', () => {
  let wrapper

  const propsData = {
    contributionId: 42,
    contributionMemo: 'It is a test memo',
    hideResubmission: true,
  }

  const mocks = {
    $t: vi.fn((t) => t),
    $apollo: {
      mutate: apolloMutateMock,
    },
    $i18n: {
      locale: 'en',
    },
  }

  const Wrapper = () => {
    return mount(ContributionMessagesFormular, {
      localVue,
      mocks,
      propsData,
    })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
      vi.clearAllMocks()
    })

    it('has a DIV .contribution-messages-formular', () => {
      expect(wrapper.find('div.contribution-messages-formular').exists()).toBe(true)
    })

    describe('on trigger reset', () => {
      beforeEach(async () => {
        wrapper.setData({
          form: {
            text: 'text form message',
          },
        })
        await wrapper.find('form').trigger('reset')
      })

      it('form has empty text and memo reset to contribution memo input', () => {
        expect(wrapper.vm.form).toEqual({
          text: '',
          memo: 'It is a test memo',
        })
      })
    })

    describe('on trigger submit', () => {
      beforeEach(async () => {
        wrapper.setData({
          form: {
            text: 'text form message',
          },
        })
        await wrapper.find('form').trigger('submit')
      })

      it('emitted "get-list-contribution-messages" with data', async () => {
        expect(wrapper.emitted('get-list-contribution-messages')).toEqual(
          expect.arrayContaining([expect.arrayContaining([42])]),
        )
      })

      it('emitted "update-status" with data', async () => {
        expect(wrapper.emitted('update-status')).toEqual(
          expect.arrayContaining([expect.arrayContaining([42])]),
        )
      })
    })

    describe('send DIALOG contribution message with success', () => {
      beforeEach(async () => {
        await wrapper.setData({
          form: {
            text: 'text form message',
          },
        })
        await wrapper.find('button[data-test="submit-dialog"]').trigger('click')
      })

      it('moderatorMessage has `DIALOG`', () => {
        expect(apolloMutateMock).toBeCalledWith({
          mutation: adminCreateContributionMessage,
          variables: {
            contributionId: 42,
            message: 'text form message',
            messageType: 'DIALOG',
            resubmissionAt: null,
          },
        })
      })

      it('toasts an success message', () => {
        expect(toastSuccessSpy).toBeCalledWith('message.request')
      })
    })

    describe('send MODERATOR contribution message with success', () => {
      beforeEach(async () => {
        await wrapper.setData({
          form: {
            text: 'text form message',
          },
        })

        // choose tab
        // tabs: text | moderator | memo
        //         0  |     1     |  2
        await wrapper
          .find('div[data-test="message-type-tabs"]')
          .findAll('.nav-item a')
          .at(1)
          .trigger('click')

        // click save
        await wrapper.find('button[data-test="submit-dialog"]').trigger('click')
      })

      it('moderatorMesage has `MODERATOR`', () => {
        expect(apolloMutateMock).toBeCalledWith({
          mutation: adminCreateContributionMessage,
          variables: {
            contributionId: 42,
            message: 'text form message',
            messageType: 'MODERATOR',
            resubmissionAt: null,
          },
        })
      })

      it('toasts an success message', () => {
        expect(toastSuccessSpy).toBeCalledWith('message.request')
      })
    })

    describe('send resubmission contribution message with success', () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days in milliseconds

      beforeEach(async () => {
        await wrapper.setData({
          form: {
            text: 'text form message',
          },
          showResubmissionDate: true,
          resubmissionDate: futureDate,
          resubmissionTime: '08:46',
        })
        await wrapper.find('button[data-test="submit-dialog"]').trigger('click')
      })

      it('graphql payload contain resubmission date', () => {
        const futureDateExactTime = futureDate
        futureDateExactTime.setHours(8)
        futureDateExactTime.setMinutes(46)
        expect(apolloMutateMock).toBeCalledWith({
          mutation: adminCreateContributionMessage,
          variables: {
            contributionId: 42,
            message: 'text form message',
            messageType: 'DIALOG',
            resubmissionAt: futureDateExactTime.toString(),
          },
        })
      })

      it('toasts an success message', () => {
        expect(toastSuccessSpy).toBeCalledWith('message.request')
      })
    })

    describe('set memo', () => {
      beforeEach(async () => {
        // choose tab
        // tabs: text | moderator | memo
        //         0  |     1     |  2
        await wrapper
          .find('div[data-test="message-type-tabs"]')
          .findAll('.nav-item a')
          .at(2)
          .trigger('click')

        // click save
        await wrapper.find('button[data-test="submit-dialog"]').trigger('click')
      })
      it('check tabindex value is 2', () => {
        expect(wrapper.vm.tabindex).toBe(2)
      })
    })

    describe('update contribution memo from moderator for user created contributions', () => {
      beforeEach(async () => {
        await wrapper.setData({
          form: {
            memo: 'changed memo',
          },
          tabindex: 2,
        })
        await wrapper.find('button[data-test="submit-dialog"]').trigger('click')
      })

      it('adminUpdateContribution was called with contributionId and updated memo', () => {
        expect(apolloMutateMock).toBeCalledWith({
          mutation: adminUpdateContribution,
          variables: {
            id: 42,
            memo: 'changed memo',
            resubmissionAt: null,
          },
        })
      })

      it('toasts an success message', () => {
        expect(toastSuccessSpy).toBeCalledWith('message.request')
      })
    })

    describe('send contribution message with error', () => {
      beforeEach(async () => {
        apolloMutateMock.mockRejectedValue({ message: 'OUCH!' })
        wrapper = Wrapper()
        await wrapper.find('form').trigger('submit')
      })

      it('toasts an error message', () => {
        expect(toastErrorSpy).toBeCalledWith('OUCH!')
      })
    })
  })
})
