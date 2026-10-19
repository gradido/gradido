import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createStore } from 'vuex'
import createPersistedState from 'vuex-persistedstate'
import CONFIG from '../config'
import store, { mutations, actions } from './store'

vi.mock('../config', () => ({
  default: {
    DEBUG_DISABLE_AUTH: false,
  },
}))

// The storage the real store was created with; the tests below put a mock in its place.
const storageOfTheStore = window.localStorage

describe('Vuex Store', () => {
  let testStore
  let localStorageMock

  beforeEach(() => {
    vi.clearAllMocks()

    localStorageMock = {
      clear: vi.fn(),
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      length: 0,
      key: vi.fn(() => null),
    }
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    })

    testStore = createStore({
      plugins: [createPersistedState()],
      state: {
        token: null,
        moderator: null,
        openCreations: 0,
        userSelectedInMassCreation: [],
      },
      mutations,
      actions,
    })
  })

  describe('Mutations', () => {
    it('openCreationsPlus', () => {
      testStore.commit('openCreationsPlus', 5)
      expect(testStore.state.openCreations).toBe(5)
    })

    it('openCreationsMinus', () => {
      testStore.state.openCreations = 10
      testStore.commit('openCreationsMinus', 3)
      expect(testStore.state.openCreations).toBe(7)
    })

    it('resetOpenCreations', () => {
      testStore.state.openCreations = 10
      testStore.commit('resetOpenCreations')
      expect(testStore.state.openCreations).toBe(0)
    })

    it('token', () => {
      testStore.commit('token', '1234')
      expect(testStore.state.token).toBe('1234')
    })

    it('setOpenCreations', () => {
      testStore.commit('setOpenCreations', 15)
      expect(testStore.state.openCreations).toBe(15)
    })

    it('moderator', () => {
      const moderator = { id: 1, name: 'Test' }
      testStore.commit('moderator', moderator)
      expect(testStore.state.moderator).toEqual(moderator)
    })
  })

  describe('Actions', () => {
    it('logout', () => {
      testStore.state.token = 'someToken'
      testStore.state.moderator = { id: 1 }

      testStore.dispatch('logout')

      expect(testStore.state.token).toBeNull()
      expect(testStore.state.moderator).toBeNull()
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('gradido-admin')
      expect(localStorageMock.clear).not.toHaveBeenCalled()
    })

    // Whom this moderator is in contact with: theirs, and nobody's who signs in next on the
    // same browser.
    it('takes with it whom the moderator is in contact with', async () => {
      const { askModeratorContacts, moderatorContact } =
        await import('@/composables/useModeratorContacts')
      const bibi = { gradidoID: 'g-bibi', communityUuid: 'home' }
      await askModeratorContacts(
        { query: vi.fn().mockResolvedValue({ data: { contactRefs: [bibi] } }) },
        1,
      )
      expect(moderatorContact(1, bibi)).toBe('yes')

      testStore.dispatch('logout')

      expect(moderatorContact(1, bibi)).toBe('unknown')
    })

    /**
     * ⛔ The faces this session fetched, and the one that is OPEN -- two different things.
     * The zoom window hangs on the token and unmounts at logout, but the state it reads lives
     * in a module: without this the next moderator on the same browser would find the
     * previous one's face open in their first second. (coderabbit, #3890.)
     */
    it("takes other people's faces with it, the open one included", async () => {
      const { fetchMemberAvatars, memberAvatarSource } =
        await import('@/composables/useMemberAvatars')
      const { memberAvatarZoomState, openMemberAvatarZoom } =
        await import('@/composables/useMemberAvatarZoom')
      const margret = {
        gradidoID: 'g-margret',
        communityUuid: 'home',
        avatarUpdatedAt: '2026-09-12T04:00:00.000Z',
      }
      await fetchMemberAvatars(
        {
          query: vi.fn().mockResolvedValue({
            data: {
              memberAvatars: [{ ...margret, avatar: 'face' }],
            },
          }),
        },
        [margret],
      )
      openMemberAvatarZoom({ member: margret, src: memberAvatarSource(margret) })
      expect(memberAvatarZoomState.value).not.toBeNull()

      testStore.dispatch('logout')

      expect(memberAvatarSource(margret)).toBe('')
      expect(memberAvatarZoomState.value).toBeNull()
    })

    it('preserves the wallet dark-mode theme across logout', () => {
      // The wallet owns 'gradido-theme-mode' but shares this origin's storage;
      // the admin logout must not wipe it (regression: dark mode lost on
      // wallet -> admin -> wallet). Stated as what must NOT happen, because the
      // logout keeps the key by never touching it: it removes its own blob and
      // nothing else. A return to clear() would fail here.
      localStorageMock.getItem = vi.fn((key) => (key === 'gradido-theme-mode' ? 'dark' : null))
      // Count only what the logout does. vuex-persistedstate probes the storage when the
      // store is created (setItem('@@', 1) + removeItem('@@')), so the counter would
      // otherwise be measuring the library's handshake as well.
      localStorageMock.removeItem.mockClear()

      testStore.dispatch('logout')

      expect(localStorageMock.clear).not.toHaveBeenCalled()
      // Exactly two removals: the admin's own blob, and the token both apps keep -- signing
      // out here signs the wallet out as well (utils/authToken.js). Naming the theme key alone
      // would still pass if the logout started removing some other key the wallet owns;
      // counting closes that off without having to list every key there is.
      expect(localStorageMock.removeItem).toHaveBeenCalledTimes(2)
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('gradido-admin')
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth-token')
    })
  })

  // The token lives where both apps keep it (utils/authToken.js), not in the admin's own blob.
  describe('the token kept for both apps', () => {
    // Tokens naming a member, as the server writes them (the subject is all that is read here).
    const tokenOf = (sub, more = {}) =>
      `h.${btoa(JSON.stringify({ sub, ...more })).replace(/=+$/, '')}.s`
    const BIBI = '1b2c3d4e-5f60-4a7b-8c9d-0e1f2a3b4c5d'
    const BOB = '7a6b5c4d-3e2f-4a1b-8c0d-9e8f7a6b5c4d'

    beforeEach(() => {
      Object.defineProperty(window, 'localStorage', { value: storageOfTheStore, writable: true })
    })

    afterEach(() => {
      storageOfTheStore.removeItem('auth-token')
      storageOfTheStore.removeItem('gradido-admin')
    })

    it('is kept by the token commit, and left out of the blob', () => {
      store.commit('token', 'token')
      expect(JSON.parse(storageOfTheStore.getItem('auth-token')).token).toBe('token')
      expect(JSON.parse(storageOfTheStore.getItem('gradido-admin'))).not.toHaveProperty('token')
      store.commit('token', null)
      expect(storageOfTheStore.getItem('auth-token')).toBeNull()
    })

    it('is renewed here where another window renews it', () => {
      store.commit('token', tokenOf(BIBI, { iat: 1 }))
      storageOfTheStore.setItem(
        'auth-token',
        JSON.stringify({ token: tokenOf(BIBI, { iat: 2 }), at: Date.now() }),
      )
      window.dispatchEvent(new StorageEvent('storage', { key: 'auth-token' }))
      expect(store.state.token).toBe(tokenOf(BIBI, { iat: 2 }))
    })

    it('signs out here where another window signs out', () => {
      store.commit('token', 'token')
      storageOfTheStore.removeItem('auth-token')
      window.dispatchEvent(new StorageEvent('storage', { key: 'auth-token' }))
      expect(store.state.token).toBeNull()
    })

    // Last: each of these opens a store of its own, which goes on listening to the windows
    // around it -- an event of a test after them would reach it too.
    const openedOn = async ({ kept, blob }) => {
      storageOfTheStore.setItem('auth-token', JSON.stringify({ token: kept, at: Date.now() }))
      storageOfTheStore.setItem('gradido-admin', JSON.stringify(blob))
      vi.resetModules()
      return (await import('./store')).default
    }

    it('is what the admin interface opens with, and not a token in a blob saved before', async () => {
      const opened = await openedOn({
        kept: tokenOf(BIBI),
        blob: { token: 'from-the-blob', moderator: { gradidoID: BIBI }, openCreations: 3 },
      })
      expect(opened.state.token).toBe(tokenOf(BIBI))
      expect(opened.state.openCreations).toBe(3)
    })

    // ⛔ Bob's token under the role of Bibi: the page sends to not-found, and the way over from
    // the wallet brings the moderator anew.
    it.each([
      ['the moderator of somebody else', { moderator: { gradidoID: BIBI, role: 'ADMIN' } }],
      ['a moderator without a pair, saved before', { moderator: { id: 3, role: 'ADMIN' } }],
      ['no moderator', {}],
    ])('is not opened with where the blob holds %s', async (_name, blob) => {
      const opened = await openedOn({ kept: tokenOf(BOB), blob })
      expect(opened.state.token).toBeNull()
      // Nor removed: it is Bob's session, in the wallet.
      expect(JSON.parse(storageOfTheStore.getItem('auth-token')).token).toBe(tokenOf(BOB))
    })
  })

  describe('Initial State', () => {
    it('sets correct initial state when DEBUG_DISABLE_AUTH is false', () => {
      expect(store.state).toEqual({
        token: null,
        moderator: null,
        openCreations: 0,
        userSelectedInMassCreation: [],
      })
    })

    it('sets correct initial state when DEBUG_DISABLE_AUTH is true', () => {
      CONFIG.DEBUG_DISABLE_AUTH = true
      const debugStore = createStore({
        plugins: [createPersistedState()],
        state: {
          token: CONFIG.DEBUG_DISABLE_AUTH ? 'validToken' : null,
          moderator: null,
          openCreations: 0,
          userSelectedInMassCreation: [],
        },
        mutations,
        actions,
      })
      expect(debugStore.state.token).toBe('validToken')
      CONFIG.DEBUG_DISABLE_AUTH = false
    })
  })
})
