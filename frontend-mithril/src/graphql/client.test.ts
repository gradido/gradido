// AI-GENERATED — not an architecture reference
import { beforeEach, describe, expect, it, mock, setSystemTime } from 'bun:test'
import { parse } from 'graphql'
import * as v from 'valibot'
import { location } from '../../test/browserStub'
import { BIBI, BOB, member, tokenOf } from '../../test/member'

type Options = {
  background: boolean
  url: string
  body: { query: string; variables: object }
  headers: Record<string, string>
  extract: (xhr: object) => unknown
}

// What was sent, in the order it was asked; each is answered when the test says so.
let asked: {
  options: Options
  answer: (body: object | string, token?: string | null) => void
  fail: (error: Error) => void
}[] = []
const send = mock(
  (options: Options) =>
    new Promise((resolve, reject) => {
      asked.push({
        options,
        fail: reject,
        answer: (body, token = null) => {
          try {
            resolve(
              options.extract({
                responseText: typeof body === 'string' ? body : JSON.stringify(body),
                getResponseHeader: (name: string) => (name === 'token' ? token : null),
              }),
            )
          } catch (error) {
            reject(error)
          }
        },
      })
    }),
)
mock.module('mithril', () => ({ default: { request: send } }))
mock.module('@frontend/config', () => ({ default: { GRAPHQL_URI: 'http://backend/graphql' } }))

const { request } = await import('./client')
const { authToken, login, session } = await import('@/store/Session')
const { appOutdated } = await import('@/store/appOutdated')

const NOW = 1760000000000
const balance = parse('query ($currency: String) { balance(currency: $currency) }')
const balanceSchema = v.object({ balance: v.nullable(v.number(), 0) })

/** A tab in which `gradidoID` is signed in. */
const signIn = (gradidoID: string) => {
  authToken.set({ token: tokenOf(gradidoID), at: NOW })
  login(member(gradidoID))
}

beforeEach(() => {
  asked = []
  send.mockClear()
  localStorage.clear()
  authToken.set(null, false)
  session.set(undefined, false)
  appOutdated.value = false
  location.reload.mockClear()
  location.assign.mockClear()
  setSystemTime(new Date(NOW))
})

describe('request', () => {
  it('throws for a variable the document does not declare', async () => {
    await expect(request(balance, { curency: 'GDD' }, balanceSchema)).rejects.toThrow('curency')
    expect(send).not.toHaveBeenCalled()
  })

  it('sends the document with its variables, as the member signed in', () => {
    signIn(BIBI)
    request(balance, { currency: 'GDD' }, balanceSchema, { background: true })
    const { options } = asked[0]
    expect(options.url).toBe('http://backend/graphql')
    expect(options.body.query).toContain('balance(currency: $currency)')
    expect(options.body.variables).toEqual({ currency: 'GDD' })
    expect(options.headers.Authorization).toBe(`Bearer ${tokenOf(BIBI)}`)
    expect(options.background).toBe(true)
  })

  it('sends no token where nobody is signed in', () => {
    request(balance, {}, balanceSchema)
    expect(asked[0].options.headers.Authorization).toBe('')
    expect(asked[0].options.background).toBe(false)
  })

  describe('the answer', () => {
    it('is read through the schema, with its defaults', async () => {
      const answered = request(balance, {}, balanceSchema)
      asked[0].answer({ data: { balance: null, more: 1 } })
      expect(await answered).toEqual({ success: true, value: { balance: 0 } })
    })

    it('is a failure where it does not fit the schema', async () => {
      const answered = request(balance, {}, balanceSchema)
      asked[0].answer({ data: { balance: 'much' } })
      const result = await answered
      expect(result.success).toBe(false)
      expect(!result.success && result.error.message).toContain('the answer does not fit')
    })

    it('is a failure where none came, none that is JSON, or none of GraphQL', async () => {
      const none = request(balance, {}, balanceSchema)
      asked[0].fail(new Error('no network'))
      expect((await none).success).toBe(false)

      const noJson = request(balance, {}, balanceSchema)
      asked[1].answer('<html>502 Bad Gateway</html>')
      expect((await noJson).success).toBe(false)

      const noGraphql = request(balance, {}, balanceSchema)
      asked[2].answer({ errors: 'broken' })
      expect((await noGraphql).success).toBe(false)
    })

    it('is a failure with every message where the server names errors', async () => {
      const answered = request(balance, {}, balanceSchema)
      asked[0].answer({ data: null, errors: [{ message: 'no user' }, { message: 'no balance' }] })
      const result = await answered
      expect(!result.success && result.error.message).toBe('no user\nno balance')
      expect(appOutdated.value).toBe(false)
    })

    it('says the wallet is outdated where the document no longer fits the server', async () => {
      const answered = request(balance, {}, balanceSchema)
      asked[0].answer({
        errors: [{ message: 'Cannot query', extensions: { code: 'GRAPHQL_VALIDATION_FAILED' } }],
      })
      expect((await answered).success).toBe(false)
      expect(appOutdated.value).toBe(true)
    })

    it('ends the session where its certificate was revoked', async () => {
      signIn(BIBI)
      const answered = request(balance, {}, balanceSchema)
      asked[0].answer({ errors: [{ message: '403.13 - Client certificate revoked' }] }, 'a-token')
      expect((await answered).success).toBe(false)
      expect(authToken.state).toBeNull()
      expect(session.state.member).toBeNull()
      expect(location.assign).toHaveBeenCalledWith('/login')
    })
  })

  describe('the token of the answer', () => {
    const renewed = tokenOf(BIBI, { iat: 2 })

    it('is taken with the time it came, for the member who asked and is still signed in', async () => {
      signIn(BIBI)
      const answered = request(balance, {}, balanceSchema)
      setSystemTime(new Date(NOW + 1000))
      asked[0].answer({ data: { balance: 1 } }, renewed)
      await answered
      expect(authToken.state).toEqual({ token: renewed, at: NOW + 1000 })
      expect(location.reload).not.toHaveBeenCalled()
    })

    // the chat's beat, a panel: a tab left open would never be signed out
    it('is not taken for a question the member did not ask', async () => {
      signIn(BIBI)
      const answered = request(balance, {}, balanceSchema, { renewSession: false })
      asked[0].answer({ data: { balance: 1 } }, renewed)
      await answered
      expect(authToken.state?.token).toBe(tokenOf(BIBI))
    })

    // a sign-in: nobody asked, and whether the session may be renewed is no question
    it('is taken where nobody was signed in when the question was asked', async () => {
      const answered = request(balance, {}, balanceSchema, { renewSession: false })
      asked[0].answer({ data: { balance: 1 } }, tokenOf(BIBI))
      await answered
      expect(authToken.state).toEqual({ token: tokenOf(BIBI), at: NOW })
      expect(location.reload).not.toHaveBeenCalled()
      expect(location.assign).not.toHaveBeenCalled()
    })

    // A question of the sign-in page, answered after the sign-in: it carries no token, and
    // must not take away the one just received.
    it('leaves the token alone where the answer carries none', async () => {
      const ofTheSignInPage = request(balance, {}, balanceSchema)
      signIn(BIBI)
      asked[0].answer({ data: { balance: 1 } })
      await ofTheSignInPage
      expect(authToken.state?.token).toBe(tokenOf(BIBI))
      expect(location.assign).not.toHaveBeenCalled()
    })

    it("is not taken where the session ended meanwhile, or is somebody else's", async () => {
      signIn(BIBI)
      const afterSignOut = request(balance, {}, balanceSchema)
      authToken.set(null, false)
      session.set(undefined, false)
      asked[0].answer({ data: { balance: 1 } }, renewed)
      await afterSignOut
      expect(authToken.state).toBeNull()

      signIn(BIBI)
      const afterBobSignedIn = request(balance, {}, balanceSchema)
      authToken.set(null, false)
      session.set(undefined, false)
      signIn(BOB)
      asked[1].answer({ data: { balance: 1 } }, renewed)
      await afterBobSignedIn
      expect(authToken.state?.token).toBe(tokenOf(BOB))
    })
  })
})
