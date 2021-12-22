import addNavigationGuards from './guards'
import router from './router'

const storeCommitMock = jest.fn()
const storeDispatchMock = jest.fn()
const apolloQueryMock = jest.fn().mockResolvedValue({
  data: {
    verifyLogin: {
      firstName: 'Peter',
    },
  },
})

const store = {
  commit: storeCommitMock,
  state: {
    token: null,
  },
  dispatch: storeDispatchMock,
}

const apollo = {
  query: apolloQueryMock,
}

addNavigationGuards(router, store, apollo)

describe('navigation guards', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('publisher ID', () => {
    it('commits the pid to the store when present', async () => {
      await router.push({ path: 'register', query: { pid: 42 } })
      expect(storeCommitMock).toBeCalledWith('publisherId', '42')
    })

    it('does not commit the pid when not present', async () => {
      await router.push({ path: 'password' })
      expect(storeCommitMock).not.toBeCalled()
    })
  })

  describe('authenticate', () => {
    const navGuard = router.beforeHooks[1]
    const next = jest.fn()

    describe('with valid token', () => {
      beforeEach(() => {
        navGuard({ path: '/authenticate', query: { token: 'valid-token' } }, {}, next)
      })

      it('commts the token to the store', () => {
        expect(storeCommitMock).toBeCalledWith('token', 'valid-token')
      })

      it('calls verifyLogin', () => {
        expect(apolloQueryMock).toBeCalled()
      })

      it('commits login to the store', () => {
        expect(storeDispatchMock).toBeCalledWith('login', { firstName: 'Peter' })
      })
    })

    describe('with valid token and server error', () => {
      beforeEach(() => {
        apolloQueryMock.mockRejectedValue({
          message: 'Ouch!',
        })
        navGuard({ path: '/authenticate', query: { token: 'valid-token' } }, {}, next)
      })

      it('dispatches logout to store', () => {
        expect(storeDispatchMock).toBeCalledWith('logout')
      })

      it('calls next', () => {
        expect(next).toBeCalledWith()
      })
    })
  })

  describe('authorization', () => {
    const navGuard = router.beforeHooks[2]
    const next = jest.fn()

    it('redirects to login when not authorized', () => {
      navGuard({ meta: { requiresAuth: true }, query: {} }, {}, next)
      expect(next).toBeCalledWith({ path: '/login' })
    })

    it('does not redirect to login when authorized', () => {
      store.state.token = 'valid token'
      navGuard({ meta: { requiresAuth: true }, query: {} }, {}, next)
      expect(next).toBeCalledWith()
    })
  })
})
