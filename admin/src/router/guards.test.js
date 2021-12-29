import addNavigationGuards from './guards'
import router from './router'

const storeCommitMock = jest.fn()
const apolloQueryMock = jest.fn().mockResolvedValue({
  data: {
    verifyLogin: {
      isAdmin: true,
    },
  },
})

const store = {
  commit: storeCommitMock,
  state: {
    token: null,
  },
}

const apollo = {
  query: apolloQueryMock,
}

addNavigationGuards(router, store, apollo)

describe('navigation guards', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('authenticate', () => {
    const navGuard = router.beforeHooks[0]
    const next = jest.fn()

    describe('with valid token and as admin', () => {
      beforeEach(() => {
        navGuard({ path: '/authenticate', query: { token: 'valid-token' } }, {}, next)
      })

      it('commits the token to the store', async () => {
        expect(storeCommitMock).toBeCalledWith('token', 'valid-token')
      })

      it('commits the moderator to the store', () => {
        expect(storeCommitMock).toBeCalledWith('moderator', { isAdmin: true })
      })

      it('redirects to /', async () => {
        expect(next).toBeCalledWith({ path: '/' })
      })
    })

    describe('with valid token and not as admin', () => {
      beforeEach(() => {
        apolloQueryMock.mockResolvedValue({
          data: {
            verifyLogin: {
              isAdmin: false,
            },
          },
        })
        navGuard({ path: '/authenticate', query: { token: 'valid-token' } }, {}, next)
      })

      it('commits the token to the store', async () => {
        expect(storeCommitMock).toBeCalledWith('token', 'valid-token')
      })

      it('does not commit the moderator to the store', () => {
        expect(storeCommitMock).not.toBeCalledWith('moderator', { isAdmin: false })
      })

      it('redirects to /not-found', async () => {
        expect(next).toBeCalledWith({ path: '/not-found' })
      })
    })

    describe('with valid token and server error on verification', () => {
      beforeEach(() => {
        apolloQueryMock.mockRejectedValue({
          message: 'Ouch!',
        })
        navGuard({ path: '/authenticate', query: { token: 'valid-token' } }, {}, next)
      })

      it('commits the token to the store', async () => {
        expect(storeCommitMock).toBeCalledWith('token', 'valid-token')
      })

      it('does not commit the moderator to the store', () => {
        expect(storeCommitMock).not.toBeCalledWith('moderator', { isAdmin: false })
      })

      it('redirects to /not-found', async () => {
        expect(next).toBeCalledWith({ path: '/not-found' })
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

    it('redirects to not found with token in store and not moderator', () => {
      store.state.token = 'valid token'
      navGuard({ path: '/' }, {}, next)
      expect(next).toBeCalledWith({ path: '/not-found' })
    })

    it('does not redirect with token in store and as moderator', () => {
      store.state.token = 'valid token'
      store.state.moderator = { isAdmin: true }
      navGuard({ path: '/' }, {}, next)
      expect(next).toBeCalledWith()
    })
  })
})
