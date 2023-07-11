import addNavigationGuards from './guards'
import router from './router'

const storeCommitMock = jest.fn()
const apolloQueryMock = jest.fn().mockResolvedValue({
  data: {
    verifyLogin: {
      roles: ['admin'],
      language: 'de',
    },
  },
})
const i18nLocaleMock = jest.fn()

const store = {
  commit: storeCommitMock,
  state: {
    token: null,
  },
}

const apollo = {
  query: apolloQueryMock,
}

const i18n = {
  locale: i18nLocaleMock,
}

addNavigationGuards(router, store, apollo, i18n)

describe('navigation guards', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('authenticate', () => {
    const navGuard = router.beforeHooks[0]
    const next = jest.fn()

    describe('with valid token and as admin', () => {
      beforeEach(async () => {
        await navGuard({ path: '/authenticate', query: { token: 'valid-token' } }, {}, next)
      })

      it('commits the token to the store', () => {
        expect(storeCommitMock).toBeCalledWith('token', 'valid-token')
      })

      it.skip('sets the locale', () => {
        expect(i18nLocaleMock).toBeCalledWith('de')
      })

      it('commits the moderator to the store', () => {
        expect(storeCommitMock).toBeCalledWith('moderator', { roles: ['admin'], language: 'de' })
      })

      it('redirects to /', () => {
        expect(next).toBeCalledWith({ path: '/' })
      })
    })

    describe('with valid token and not as admin', () => {
      beforeEach(() => {
        apolloQueryMock.mockResolvedValue({
          data: {
            verifyLogin: {
              roles: [],
            },
          },
        })
        navGuard({ path: '/authenticate', query: { token: 'valid-token' } }, {}, next)
      })

      it('commits the token to the store', async () => {
        expect(storeCommitMock).toBeCalledWith('token', 'valid-token')
      })

      it('does not commit the moderator to the store', () => {
        expect(storeCommitMock).not.toBeCalledWith('moderator', {
          roles: [],
        })
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
        expect(storeCommitMock).not.toBeCalledWith('moderator', { roles: ['admin'] })
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
      store.state.moderator = { roles: ['moderator'] }
      navGuard({ path: '/' }, {}, next)
      expect(next).toBeCalledWith()
    })
  })
})
