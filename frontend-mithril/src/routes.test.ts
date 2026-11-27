// AI-GENERATED — not an architecture reference
import { describe, expect, it, mock } from 'bun:test'
import { location, otherTabStores } from '../test/browserStub'
import { BIBI, BOB, member, tokenOf } from '../test/member'

// the answer to `verifyLogin`, held until the test gives it
let answer: (value: unknown) => void = mock()
mock.module('@/graphql/client', () => ({
  request: mock(() => new Promise((resolve) => (answer = resolve))),
}))
// the pages are of no matter here, and load icons Bun does not know
for (const page of [
  'ConfirmEmail',
  'EmailChange',
  'ForgotPassword',
  'Login',
  'NotFound',
  'PublicProfile',
  'Register',
  'RegisterCommunity',
  'ResetPassword',
]) {
  mock.module(`@/pages/${page}`, () => ({ [page]: {} }))
}
const routeSet = mock()
const m = (await import('mithril')).default
m.route.set = routeSet
Object.assign(location, {
  search: '',
  href: 'http://localhost/authenticate',
  origin: 'http://localhost',
})

const { ROUTES } = await import('./routes')
const { authToken, session } = await import('./store/Session')
const verified = (gradidoID: string) => ({
  success: true,
  value: { verifyLogin: member(gradidoID) },
})

const tokenFor = (gradidoID: string, iat = 1) =>
  JSON.stringify({ token: tokenOf(gradidoID, { iat, exp: 9e9 }), at: Date.now() })
const authenticate = () => {
  const route = ROUTES['/authenticate']
  return 'leadsOn' in route ? route.leadsOn() : undefined
}

describe('/authenticate', () => {
  it('signs nobody in where another tab signed somebody else in meanwhile', async () => {
    otherTabStores('auth-token', tokenFor(BIBI))
    const way = authenticate()
    otherTabStores('auth-token', tokenFor(BOB))
    answer(verified(BIBI))
    await way
    expect(session.state.member).toBeNull()
    expect(authToken.state?.tokenMemberId).toBe(BOB)
    expect(routeSet).not.toHaveBeenCalled()
  })

  it('signs nobody out where another tab signed somebody else in meanwhile', async () => {
    otherTabStores('auth-token', tokenFor(BIBI))
    const way = authenticate()
    otherTabStores('auth-token', tokenFor(BOB))
    answer({ success: false, error: { message: '401 Unauthorized' } })
    await way
    expect(location.assign).not.toHaveBeenCalled()
    expect(authToken.state?.tokenMemberId).toBe(BOB)
  })

  it('signs in where the token of the same member was renewed meanwhile', async () => {
    otherTabStores('auth-token', tokenFor(BIBI))
    const way = authenticate()
    otherTabStores('auth-token', tokenFor(BIBI, 2))
    answer(verified(BIBI))
    await way
    expect(session.state.member?.gradidoID).toBe(BIBI)
    expect(routeSet).toHaveBeenCalledWith('/overview', null, { replace: true })
  })
})
