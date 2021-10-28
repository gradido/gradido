import { RouterLinkStub, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import Login from './Login'
import { getCommunityInfo } from '../../mixin/getCommunityInfo'

const localVue = global.localVue
localVue.mixin(getCommunityInfo)

const apolloQueryMock = jest.fn().mockResolvedValue({
  data: {
    getCommunityInfo: {
      name: 'test12',
      description: 'test community 12',
      url: 'http://test12.test12/',
      registerUrl: 'http://test12.test12/vue/register',
    },
  },
})

const toastErrorMock = jest.fn()
const mockStoreDispach = jest.fn()
const mockStoreCommit = jest.fn((target, community) => {
  // console.log('mockStoreCommit', global.$store.state.community)
  global.$store.state[target] = community
  // console.log('mockStoreCommit', global.$store.state.community)
})
const mockRouterPush = jest.fn()
const spinnerHideMock = jest.fn()
const spinnerMock = jest.fn(() => {
  return {
    hide: spinnerHideMock,
  }
})

global.$store = {
  dispatch: mockStoreDispach,
  commit: mockStoreCommit,
  state: {
    community: null,
    publisherId: 12345,
  },
}
global.$toasted = {
  error: toastErrorMock,
}
global.$apollo = {
  query: apolloQueryMock,
}

describe('Login', () => {
  let wrapper

  const mocks = {
    $i18n: {
      locale: 'en',
    },
    $t: jest.fn((t) => t),
    $store: global.$store,
    $loading: {
      show: spinnerMock,
    },
    $router: {
      push: mockRouterPush,
    },
    $toasted: global.$toasted,
    $apollo: global.$apollo,
  }

  const stubs = {
    RouterLink: RouterLinkStub,
  }

  const Wrapper = () => {
    return mount(Login, { localVue, mocks, stubs })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('commits the community info to the store', () => {
      expect(mockStoreCommit).toBeCalledWith('community', {
        name: 'test12',
        description: 'test community 12',
        url: 'http://test12.test12/',
        registerUrl: 'http://test12.test12/vue/register',
      })
    })

    it('renders the Login form', () => {
      expect(wrapper.find('div.login-form').exists()).toBeTruthy()
    })

    describe('communities gives back error', () => {
      beforeEach(() => {
        apolloQueryMock.mockRejectedValue({
          message: 'Failed to get communities',
        })
        wrapper = Wrapper()
      })

      it('toasts an error message', () => {
        expect(toastErrorMock).toBeCalledWith('Failed to get communities')
      })
    })

    describe('Login header', () => {
      it('has a welcome message', () => {
        expect(wrapper.find('div.header').text()).toBe('Gradido site.login.community')
      })
    })

    describe('Community Data', () => {
      it('has a Community name', () => {
        expect(wrapper.find('.test-communitydata b').text()).toBe('test12')
      })

      it('has a Community description', () => {
        expect(wrapper.find('.test-communitydata p').text()).toBe('test community 12')
      })
    })

    describe('links', () => {
      it('has a link "Forgot Password"', () => {
        expect(wrapper.findAllComponents(RouterLinkStub).at(0).text()).toEqual(
          'settings.password.forgot_pwd',
        )
      })

      it('links to /password when clicking "Forgot Password"', () => {
        expect(wrapper.findAllComponents(RouterLinkStub).at(0).props().to).toBe('/password')
      })

      it('has a link "Create new account"', () => {
        expect(wrapper.findAllComponents(RouterLinkStub).at(1).text()).toEqual(
          'site.login.new_wallet',
        )
      })

      it('links to /register when clicking "Create new account"', () => {
        expect(wrapper.findAllComponents(RouterLinkStub).at(1).props().to).toBe('/register')
      })
    })

    describe('Login form', () => {
      it('has a login form', () => {
        expect(wrapper.find('form').exists()).toBeTruthy()
      })

      it('has an Email input field', () => {
        expect(wrapper.find('input[placeholder="Email"]').exists()).toBeTruthy()
      })

      it('has an Password input field', () => {
        expect(wrapper.find('input[placeholder="form.password"]').exists()).toBeTruthy()
      })

      it('has a Submit button', () => {
        expect(wrapper.find('button[type="submit"]').exists()).toBeTruthy()
      })
    })

    describe('submit', () => {
      describe('no data', () => {
        it('displays a message that Email is required', async () => {
          await wrapper.find('form').trigger('submit')
          await flushPromises()
          expect(wrapper.findAll('div.invalid-feedback').at(0).text()).toBe(
            'validations.messages.required',
          )
        })

        it('displays a message that password is required', async () => {
          await wrapper.find('form').trigger('submit')
          await flushPromises()
          expect(wrapper.findAll('div.invalid-feedback').at(1).text()).toBe(
            'validations.messages.required',
          )
        })
      })

      describe('valid data', () => {
        beforeEach(async () => {
          jest.clearAllMocks()
          await wrapper.find('input[placeholder="Email"]').setValue('user@example.org')
          await wrapper.find('input[placeholder="form.password"]').setValue('1234')
          await flushPromises()
          await wrapper.find('form').trigger('submit')
          await flushPromises()
          apolloQueryMock.mockResolvedValue({
            data: {
              login: 'token',
            },
          })
        })

        it('calls the API with the given data', () => {
          expect(apolloQueryMock).toBeCalledWith(
            expect.objectContaining({
              variables: {
                email: 'user@example.org',
                password: '1234',
                publisherId: 12345,
              },
            }),
          )
        })

        it('creates a spinner', () => {
          expect(spinnerMock).toBeCalled()
        })

        describe('login success', () => {
          it('dispatches server response to store', () => {
            expect(mockStoreDispach).toBeCalledWith('login', 'token')
          })

          it('redirects to overview page', () => {
            expect(mockRouterPush).toBeCalledWith('/overview')
          })

          it('hides the spinner', () => {
            expect(spinnerHideMock).toBeCalled()
          })
        })

        describe('login fails', () => {
          beforeEach(() => {
            apolloQueryMock.mockRejectedValue({
              message: 'Ouch!',
            })
          })

          it('hides the spinner', () => {
            expect(spinnerHideMock).toBeCalled()
          })

          it('toasts an error message', () => {
            expect(toastErrorMock).toBeCalledWith('error.no-account')
          })
        })
      })
    })
  })
})
