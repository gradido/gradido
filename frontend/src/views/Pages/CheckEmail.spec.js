import { mount, RouterLinkStub } from '@vue/test-utils'
import CheckEmail from './CheckEmail'

const localVue = global.localVue

const apolloQueryMock = jest.fn().mockRejectedValue({ message: 'error' })

const toasterMock = jest.fn()
const routerPushMock = jest.fn()

describe('CheckEmail', () => {
  let wrapper

  const mocks = {
    $i18n: {
      locale: 'en',
    },
    $t: jest.fn((t) => t),
    $route: {
      params: {
        optin: '123',
      },
    },
    $toasted: {
      error: toasterMock,
    },
    $router: {
      push: routerPushMock,
    },
    $loading: {
      show: jest.fn(() => {
        return { hide: jest.fn() }
      }),
    },
    $apollo: {
      query: apolloQueryMock,
    },
  }

  const stubs = {
    RouterLink: RouterLinkStub,
  }

  const Wrapper = () => {
    return mount(CheckEmail, { localVue, mocks, stubs })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('calls the checkEmail when created', async () => {
      expect(apolloQueryMock).toBeCalledWith(
        expect.objectContaining({ variables: { optin: '123' } }),
      )
    })

    describe('No valid optin', () => {
      it('toasts an error when no valid optin is given', () => {
        expect(toasterMock).toHaveBeenCalledWith('error')
      })

      it('has a message suggesting to contact the support', () => {
        expect(wrapper.find('div.header').text()).toContain('checkEmail.title')
        expect(wrapper.find('div.header').text()).toContain('checkEmail.errorText')
      })
    })

    describe('is authenticated', () => {
      beforeEach(() => {
        apolloQueryMock.mockResolvedValue({
          data: {
            checkEmail: {
              sessionId: 1,
              email: 'user@example.org',
              language: 'de',
            },
          },
        })
      })

      it.skip('Has sessionId from API call', async () => {
        await wrapper.vm.$nextTick()
        expect(wrapper.vm.sessionId).toBe(1)
      })

      describe('Register header', () => {
        it('has a welcome message', async () => {
          expect(wrapper.find('div.header').text()).toContain('checkEmail.title')
        })
      })

      describe('links', () => {
        it('has a link "Back"', async () => {
          expect(wrapper.findAllComponents(RouterLinkStub).at(0).text()).toEqual('back')
        })

        it('links to /login when clicking "Back"', async () => {
          expect(wrapper.findAllComponents(RouterLinkStub).at(0).props().to).toBe('/Login')
        })
      })
    })
  })
})
