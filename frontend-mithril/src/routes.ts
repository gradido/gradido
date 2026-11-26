import CONFIG from '@frontend/config'
import { safeWalletPath } from '@frontend/utils/safeWalletPath'
import m from 'mithril'
import * as v from 'valibot'
import { memberSchema } from '@/data/Member.schema'
import { request } from '@/graphql/client'
import { verifyLogin } from '@/graphql/member'
import { setLocale } from '@/i18n'
import { ConfirmEmail } from '@/pages/ConfirmEmail'
import { EmailChange } from '@/pages/EmailChange'
import { ForgotPassword } from '@/pages/ForgotPassword'
import { Login } from '@/pages/Login'
import { NotFound } from '@/pages/NotFound'
import { PublicProfile } from '@/pages/PublicProfile'
import { Register } from '@/pages/Register'
import { RegisterCommunity } from '@/pages/RegisterCommunity'
import { ResetPassword } from '@/pages/ResetPassword'
import type { Route } from '@/router'
import { authToken, authTokenSchema, login, logout, session } from '@/store/Session'

// A page of a later step of todo.md, which a page ported already leads to: the address
// exists, with its guard, and says which build answers.
const notPortedYet = {
  view: () => m('main', `Gradido ${CONFIG.APP_VERSION} (Mithril)`),
}

const signIn = { page: Login }
const register = { page: Register }
const forgotPassword = { page: ForgotPassword }
const resetPassword = { page: ResetPassword }
const emailChange = { page: EmailChange }

/**
 * Every address of the wallet. `:name` takes one part of an address, `:name...` the rest of
 * it; Mithril knows no part that may be missing, so such an address has a row for each length.
 * The pages are imported, not fetched when opened: one bundle, and a page opens without a
 * further request. Fetched apart: the languages (i18n.ts).
 */
export const ROUTES: Record<string, Route> = {
  // never opened: the guard leads on to the sign-in
  '/': signIn,
  '/login': signIn,
  // with the code of a link to redeem, which the sign-in goes on to
  '/login/:code': signIn,
  '/register': register,
  '/register/:code': register,
  '/register-community': { page: RegisterCommunity },
  '/forgot-password': forgotPassword,
  // from a link that ran out: the page says so
  '/forgot-password/:comingFrom': forgotPassword,
  '/reset-password/:optin': resetPassword,
  // a new account's first password; the code of a link to redeem and its community go on
  '/checkEmail/:optin': resetPassword,
  '/checkEmail/:optin/:code': resetPassword,
  '/checkEmail/:optin/:code/:codeCommunityUuid': resetPassword,
  '/email-change/revoke/:changeCode': emailChange,
  '/email-change/:changeCode': emailChange,
  '/confirm-email/:confirmationCode': { page: ConfirmEmail },
  '/u/:alias': { page: PublicProfile },
  '/authenticate': { leadsOn: authenticate },
  '/overview': { page: notPortedYet, requiresAuth: true },
  '/send/:communityIdentifier/:userIdentifier': { page: notPortedYet, requiresAuth: true },
  '/redeem/:code': { page: notPortedYet },
  '/:path...': { page: NotFound },
}

/**
 * The way in for a member the admin interface hands over (`/authenticate`). Where the two
 * share an origin they share the token, which is there already; from another origin it
 * comes in the address (`?token=`). The server says whose it is, and the way goes on to the
 * page of the wallet `?redirect=` names, else to the overview.
 */
async function authenticate() {
  // From the address itself: Mithril decodes a query twice, and the page to go on to has a
  // query of its own. And its parameters are those of the page shown, not of this way in.
  const query = new URLSearchParams(location.search)
  const token = query.get('token')
  if (token && new URL(CONFIG.ADMIN_AUTH_URL, location.href).origin !== location.origin) {
    authToken.set(v.parse(authTokenSchema, { token, at: Date.now() }))
  }
  const answer = authToken.state
    ? await request(verifyLogin, {}, v.object({ verifyLogin: memberSchema }))
    : undefined
  if (answer?.success) {
    login(answer.value.verifyLogin)
    await setLocale(session.state.language ?? answer.value.verifyLogin.language)
    m.route.set(safeWalletPath(query.get('redirect')) ?? '/overview', null, { replace: true })
  } else {
    // a token the server does not take is none
    if (authToken.state) {
      logout()
    }
    m.route.set('/login', null, { replace: true })
  }
}
