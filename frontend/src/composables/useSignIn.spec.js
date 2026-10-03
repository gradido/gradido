// AI-GENERATED — not an architecture reference
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useSignIn } from './useSignIn'

/**
 * Signing in, as the login page and the page a thank-you is accepted on both do it. What is
 * held here is the order of the steps and that a refusal leaves everything as it was; the two
 * pages hold what they do around it (Login.spec.js, TransactionLink.thanks.spec.js).
 */
const apollo = vi.hoisted(() => ({ login: null, updateUserInfos: null }))
const cache = vi.hoisted(() => ({ clear: null }))
const session = vi.hoisted(() => ({ store: null }))

vi.mock('@vue/apollo-composable', async () => {
  const { login, updateUserInfos } = await import('@/graphql/mutations')
  return {
    useMutation: (document) => {
      if (document === login) return { mutate: (...args) => apollo.login(...args) }
      if (document === updateUserInfos) {
        return { mutate: (...args) => apollo.updateUserInfos(...args) }
      }
      throw new Error('a mutation this test does not know')
    },
  }
})

vi.mock('vuex', () => ({ useStore: () => session.store }))

vi.mock('@/plugins/apolloCache', () => ({
  clearApolloCache: (...args) => cache.clear(...args),
}))

const MEMBER = { gradidoID: '0b2f6e11-2c3d-4e5f-8a9b-0c1d2e3f4a5b', language: 'de' }
const TYPED = { email: 'sarah@provence.fr', password: 'Aa12345_' }

describe('useSignIn', () => {
  let steps

  beforeEach(() => {
    steps = []
    const step = (name, answer) =>
      vi.fn(async (...args) => {
        steps.push(name)
        return typeof answer === 'function' ? answer(...args) : answer
      })
    apollo.login = step('login', { data: { login: MEMBER } })
    apollo.updateUserInfos = step('updateUserInfos', { data: { updateUserInfos: true } })
    cache.clear = step('clear the cache')
    session.store = {
      state: { publisherId: 2896, project: 'probe', preLoginLanguage: null },
      dispatch: step('store: login', (_, member) => {
        // As the wallet's action: it takes the language that was chosen before signing in.
        session.store.state.preLoginLanguage = null
        return member
      }),
      commit: vi.fn((name) => {
        steps.push(`store: ${name}`)
      }),
    }
  })

  it('asks the server with the address, the password and what the session carries', async () => {
    await useSignIn().signIn(TYPED)

    expect(apollo.login).toHaveBeenCalledTimes(1)
    expect(apollo.login).toHaveBeenCalledWith({
      email: 'sarah@provence.fr',
      password: 'Aa12345_',
      publisherId: 2896,
      project: 'probe',
    })
  })

  // ⛔ The cache goes before the member stands in the store: what the previous member's
  // queries answered is still lying there, and nothing reloads the page.
  it('empties the cache after the answer and before the member stands in the store', async () => {
    await useSignIn().signIn(TYPED)

    expect(steps).toEqual(['login', 'clear the cache', 'store: login', 'store: email'])
    expect(session.store.dispatch).toHaveBeenCalledWith('login', MEMBER)
    expect(session.store.commit).toHaveBeenCalledWith('email', 'sarah@provence.fr')
  })

  it('hands back the member the server signed in', async () => {
    expect(await useSignIn().signIn(TYPED)).toEqual(MEMBER)
  })

  it('throws what the server answered, and leaves cache and store as they were', async () => {
    const refusal = Object.assign(new Error('No user with this credentials'), {
      graphQLErrors: [{ message: 'No user with this credentials' }],
    })
    apollo.login = vi.fn().mockRejectedValue(refusal)

    await expect(useSignIn().signIn(TYPED)).rejects.toBe(refusal)

    expect(cache.clear).not.toHaveBeenCalled()
    expect(session.store.dispatch).not.toHaveBeenCalled()
    expect(session.store.commit).not.toHaveBeenCalled()
  })

  describe('a language chosen before signing in', () => {
    it('is written to the account where it is another one', async () => {
      session.store.state.preLoginLanguage = 'fr'

      await useSignIn().signIn(TYPED)

      expect(apollo.updateUserInfos).toHaveBeenCalledWith({ locale: 'fr' })
      expect(steps).toEqual([
        'login',
        'clear the cache',
        'store: login',
        'updateUserInfos',
        'store: email',
      ])
    })

    it('is not written where the account has it already, or none was chosen', async () => {
      session.store.state.preLoginLanguage = 'de'
      await useSignIn().signIn(TYPED)

      session.store.state.preLoginLanguage = null
      await useSignIn().signIn(TYPED)

      expect(apollo.updateUserInfos).not.toHaveBeenCalled()
    })

    // Best effort: the language chosen applies in the wallet already.
    it('does not stop the sign-in where it cannot be written', async () => {
      session.store.state.preLoginLanguage = 'fr'
      apollo.updateUserInfos = vi.fn().mockRejectedValue(new Error('Failed to fetch'))

      await expect(useSignIn().signIn(TYPED)).resolves.toEqual(MEMBER)
      expect(session.store.commit).toHaveBeenCalledWith('email', 'sarah@provence.fr')
    })
  })

  // In the iPhone's home-screen app, iOS kept offering the saved password after every later
  // tap: the form went away while its field still held the focus.
  it('lets go of the field that holds the focus', async () => {
    const field = document.createElement('input')
    document.body.appendChild(field)
    field.focus()
    expect(document.activeElement).toBe(field)

    await useSignIn().signIn(TYPED)

    expect(document.activeElement).not.toBe(field)
    field.remove()
  })

  it('keeps the password to itself: it goes into the request and nowhere else', async () => {
    await useSignIn().signIn(TYPED)

    const kept = JSON.stringify([
      session.store.dispatch.mock.calls,
      session.store.commit.mock.calls,
      session.store.state,
    ])
    expect(kept).not.toContain('Aa12345_')
  })
})
