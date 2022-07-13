import { mount } from '@vue/test-utils'
import SessionLogoutTimeout from './SessionLogoutTimeout'

const localVue = global.localVue

const apolloQueryMock = jest.fn()

const setTokenTime = (seconds) => {
  const now = new Date()
  return Math.floor(new Date(now.setSeconds(now.getSeconds() + seconds)).getTime() / 1000)
}

const mocks = {
  $store: {
    state: {
      token: '1234',
      tokenTime: setTokenTime(120),
    },
  },
  $i18n: {
    locale: 'en',
  },
  $t: jest.fn((t) => t),
  $apollo: {
    query: apolloQueryMock,
  },
  $route: {
    meta: {
      requiresAuth: true,
    },
  },
}

describe('SessionLogoutTimeout', () => {
  let wrapper, spy

  const Wrapper = () => {
    return mount(SessionLogoutTimeout, { localVue, mocks })
  }

  describe('mount', () => {
    beforeEach(() => {
      jest.clearAllMocks()
      wrapper = Wrapper()
    })

    it('renders the component div.session-logout-timeout', () => {
      expect(wrapper.find('div.session-logout-timeout').exists()).toBe(true)
    })

    describe('timers', () => {
      it('has a token expires timer', () => {
        expect(wrapper.vm.$options.timers).toEqual({
          tokenExpires: expect.objectContaining({
            name: 'tokenExpires',
            time: 15000,
            repeat: true,
            immediate: true,
            autostart: true,
            isSwitchTab: false,
          }),
        })
      })

      describe('token is expired for several seconds', () => {
        beforeEach(() => {
          mocks.$store.state.tokenTime = setTokenTime(-60)
          wrapper = Wrapper()
        })

        it('value for remaining seconds is 0', () => {
          expect(wrapper.tokenExpiresInSeconds === 0)
        })

        it('emits logout', () => {
          expect(wrapper.emitted('logout')).toBeTruthy()
        })
      })

      describe('token time less than 75 seconds', () => {
        beforeEach(() => {
          mocks.$store.state.tokenTime = setTokenTime(60)
          jest.useFakeTimers()
          wrapper = Wrapper()
          spy = jest.spyOn(wrapper.vm.$bvModal, 'msgBoxConfirm')
          spy.mockImplementation(() => Promise.resolve(true))
        })

        it('sets the timer to 1000', () => {
          expect(wrapper.vm.timers.tokenExpires.time).toBe(1000)
        })

        it.skip('opens the modal', () => {
          jest.advanceTimersByTime(1000)
          jest.advanceTimersByTime(1000)
          jest.advanceTimersByTime(1000)
          jest.advanceTimersByTime(1000)
          expect(spy).toBeCalled()
        })
      })
    })
  })
})
