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
    it('commits the pid to the store when present', () => {
      router.push({ path: 'login', query: { pid: 42 } })
      expect(storeCommitMock).toBeCalledWith('publisherId', '42')
    })

    it('does not commit the pid when not present', () => {
      router.push({ path: 'register' })
      expect(storeCommitMock).not.toBeCalled()
    })
  })

  describe('authorization', () => {
    it.skip('redirects to login when not authorized', async () => {
      router.push({ path: 'overview' })
      expect(router.history.current.path).toBe('/login')
    })
  })
})
