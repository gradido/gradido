import { mount } from '@vue/test-utils'
import QrCode from './QrCode'

const localVue = global.localVue

describe('QrCode', () => {
  let wrapper

  const mocks = {
    $t: jest.fn((t) => t),
  }

  const stubs = {
    QrcodeStream: true,
    QrcodeCapture: true,
  }

  const Wrapper = () => {
    return mount(QrCode, { localVue, mocks, stubs })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the component', () => {
      expect(wrapper.find('div.alert').exists()).toBeTruthy()
    })

    describe('scanning', () => {
      beforeEach(async () => {
        wrapper.find('a').trigger('click')
      })

      it('has a scanning stream', () => {
        expect(wrapper.findComponent({ name: 'QrcodeStream' }).exists()).toBeTruthy()
      })

      describe('decode', () => {
        beforeEach(async () => {
          await wrapper
            .findComponent({ name: 'QrcodeStream' })
            .vm.$emit('decode', '[{"email": "user@example.org", "amount": 10.0}]')
        })

        it('emits set transaction', () => {
          expect(wrapper.emitted()['set-transaction']).toEqual([
            [
              {
                email: 'user@example.org',
                amount: 10,
              },
            ],
          ])
        })
      })

      describe('detect', () => {
        beforeEach(async () => {
          await wrapper.find('div.row > *').vm.$emit('detect')
        })

        it('calls onDetect', () => {
          expect(wrapper.vm.detect).toBeTruthy()
        })
      })
    })
  })
})
