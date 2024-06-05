import { mount } from '@vue/test-utils'
import Circles from './Circles'
import { authenticateHumhubAutoLogin } from '@/graphql/queries'

const localVue = global.localVue

const TEST_URL_WITH_JWT_TOKEN =
  'https://community.gradido.net/user/auth/external?authclient=jwt&jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTY4NTI0NjQxMn0.V2h4Rf3LfdOYDsx2clVCx-jbhKoY5F4Ks5-YJGVtHRk'

const apolloQueryMock = jest.fn().mockResolvedValue({
  data: {
    authenticateHumhubAutoLogin: TEST_URL_WITH_JWT_TOKEN,
  },
})

describe('Circles', () => {
  let wrapper

  const mocks = {
    $t: jest.fn((t) => t),
    $n: jest.fn(),
    $i18n: {
      locale: 'en',
    },
    $apollo: {
      query: apolloQueryMock,
    },
    $store: {
      state: {
        humhubAllowed: true,
      },
      commit: jest.fn(),
    },
  }

  const Wrapper = () => {
    return mount(Circles, {
      localVue,
      mocks,
    })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the circles page', () => {
      expect(wrapper.find('div.circles').exists()).toBeTruthy()
    })

    it('calls authenticateHumhubAutoLogin', () => {
      expect(apolloQueryMock).toBeCalledWith(
        expect.objectContaining({
          query: authenticateHumhubAutoLogin,
          fetchPolicy: 'network-only',
        }),
      )
    })

    it('sets humhubUri and enables button on success', async () => {
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.humhubUri).toBe(TEST_URL_WITH_JWT_TOKEN)
      expect(wrapper.vm.enableButton).toBe(true)
    })

    describe('error apolloQueryMock', () => {
      beforeEach(async () => {
        jest.clearAllMocks()
        apolloQueryMock.mockRejectedValue({
          message: 'uups',
        })
        wrapper = Wrapper()
        await wrapper.vm.$nextTick()
      })

      it('toasts an error message and disables humhub', () => {
        expect(wrapper.vm.enableButton).toBe(true)
        expect(wrapper.vm.humhubUri).toBe('')
        expect(mocks.$store.commit).toBeCalledWith('humhubAllowed', false)
      })
    })
  })
})
