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
