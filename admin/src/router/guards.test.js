import addNavigationGuards from './guards'
import router from './router'

const storeCommitMock = jest.fn()

const store = {
  commit: storeCommitMock,
  state: {
    token: null,
  },
}

addNavigationGuards(router, store)

describe('navigation guards', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('authenticate', () => {
    const navGuard = router.beforeHooks[0]
    const next = jest.fn()

    describe('with valid token', () => {
      it('commits the token to the store', async () => {
        navGuard({ path: '/authenticate', query: { token: 'valid-token' } }, {}, next)
        expect(storeCommitMock).toBeCalledWith('token', 'valid-token')
      })

      it('redirects to /', async () => {
        navGuard({ path: '/authenticate', query: { token: 'valid-token' } }, {}, next)
        expect(next).toBeCalledWith({ path: '/' })
      })
    })

    describe('without valid token', () => {
      it('does not commit the token to the store', async () => {
        navGuard({ path: '/authenticate' }, {}, next)
        expect(storeCommitMock).not.toBeCalledWith()
      })

      it('calls next withou arguments', async () => {
        navGuard({ path: '/authenticate' }, {}, next)
        expect(next).toBeCalledWith()
      })
    })
  })

  describe('protect all routes', () => {
    const navGuard = router.beforeHooks[1]
    const next = jest.fn()

    it('redirects no not found with no token in store ', () => {
      navGuard({ path: '/' }, {}, next)
      expect(next).toBeCalledWith({ path: '/not-found' })
    })

    it('does not redirect when token in store', () => {
      store.state.token = 'valid token'
      navGuard({ path: '/' }, {}, next)
      expect(next).toBeCalledWith()
    })
  })
})
