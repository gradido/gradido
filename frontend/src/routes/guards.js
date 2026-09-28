import { START_LOCATION } from 'vue-router'
import { verifyLogin } from '../graphql/queries'
import { clearApolloCache } from '../plugins/apolloCache'
import { mayFind } from '../utils/matchingPosition'
import { holdChatText, takeChatReturn } from '../utils/chatReturn'

/**
 * Whether the stored session still runs: a token, and more than five seconds before it ends --
 * the margin the redeem page allows too (TransactionLink.vue). `tokenTime` is when the session
 * ends by this device's clock, in seconds (the `token` mutation in store.js).
 */
const sessionRuns = (state) =>
  Boolean(state.token) && Boolean(state.tokenTime) && state.tokenTime * 1000 - Date.now() > 5000

/** Whether a route is the overview, however its address was written (the record decides). */
const isOverview = (to) => to.matched[to.matched.length - 1]?.path === '/overview'

/** The conversation with `partner` in the contact window, the way the mail's reply opens it (P4c). */
const conversationWith = (partner) => ({
  path: '/contacts',
  query: partner.communityUuid
    ? { with: partner.gradidoID, community: partner.communityUuid }
    : { with: partner.gradidoID },
})

const addNavigationGuards = (router, store, apollo) => {
  // handle publisherId
  router.beforeEach((to, from, next) => {
    const publisherId = to.query.pid
    if (publisherId) {
      store.commit('publisherId', publisherId)
      delete to.query.pid
    }
    next()
  })

  // store token on authenticate
  router.beforeEach(async (to, from, next) => {
    if (to.path === '/authenticate' && to.query.token) {
      // Another account may have been signed in here without logging out. Queries that
      // take no variables share one cache key, so they would answer from that account's
      // cache until the network catches up.
      await clearApolloCache()
      store.commit('token', to.query.token)
      await apollo
        .query({
          query: verifyLogin,
          fetchPolicy: 'network-only',
        })
        .then((result) => {
          // The picture and its visibility switch are part of the login action now -- both
          // answers carry them, so dispatching one is enough and the two commits that
          // used to stand here would only write the same values again.
          store.dispatch('login', result.data.verifyLogin)
          // The address is not: no login answer selects it. This is what makes the
          // settings page tell the truth after an address change, because the store's copy
          // is only ever written where somebody holds a fresh answer from the server, and
          // this guard is the one place a member passes through regularly without signing
          // in again. Without it the page shows the address of the last sign-in until the
          // next one - a reload does not help, because the store is persisted.
          store.commit('email', result.data.verifyLogin.emailContact?.email ?? '')
          next({ path: '/overview' })
        })
        .catch(() => {
          store.dispatch('logout')
          next()
        })
    } else {
      next()
    }
  })

  // A wallet that starts while its session still runs does not ask for the sign-in again. On an
  // iPhone's home screen the wallet starts over whenever iOS wants its memory for another app --
  // SwissTransfer's for an upload, Jitsi's for a call -- and it came back on the sign-in form
  // with the session still running (Bernd, 26. and 27.09.2026). So a start on the sign-in page,
  // or on `/`, which leads there, goes on at once: with a redeem code to its link, as the sign-in
  // itself does (Login.vue), otherwise to the overview. Not to `redirectPath`: it is written for
  // somebody signed out, so with a session running it can only be left over from before.
  //
  // ⛔ Only when the wallet STARTS there (a new start, a reload, an address from outside). A way
  // into the sign-in page from inside the running wallet keeps the form, so signing in over an
  // open session stays possible -- after a registration on a phone where somebody is still
  // signed in, its "Sign in" leads to the form, and Login.vue clears the cache for exactly that.
  // And not with `?project=`: that page signs in FOR a project and hands the member over to it,
  // which going on would skip.
  //
  // ⭐ And back into the conversation (Bernd, 27.09.2026: "not in the dialog thread any more"):
  // where a thread was open as the wallet went out of sight and did not come back, the start on
  // the sign-in page, on `/` or on the overview -- where iOS starts the app from the home screen
  // -- opens that conversation again (utils/chatReturn). The note serves the one start after it,
  // whatever that start becomes, so it is taken first: without a running session the member signs
  // in anew, and a conversation from before is nowhere to come back to. The words not sent yet go
  // to that conversation's field in memory, and only where the start opens it -- never through
  // the address, which the browser keeps in its history.
  router.beforeEach((to, from, next) => {
    if (from !== START_LOCATION) return next()
    const back = takeChatReturn(store.state.gradidoID)
    if (to.query.project || !sessionRuns(store.state)) return next()
    if (to.name === 'Login' && to.params.code) {
      return next({ name: 'Redeem', params: { code: to.params.code }, query: to.query })
    }
    if (to.name !== 'Login' && !isOverview(to)) return next()
    if (back) {
      holdChatText(back)
      return next(conversationWith(back))
    }
    return to.name === 'Login' ? next({ path: '/overview' }) : next()
  })

  // handle authentication
  //
  // ⭐ A sign-in that has run out is no sign-in (Bernd, 28.09.2026: the reply button of a mail
  // should lead into the conversation for every member). Only the token's presence used to be
  // asked here, so a wallet closed more than a session ago opened the page with the old token:
  // its first questions came back 403.13, and the logout behind them (apolloProvider.js) set
  // the way back to the overview -- after signing in, the member stood on the overview, and the
  // link they came with was gone. So the old sign-in is put away here first, as that logout
  // does, and the link waits at the form like that of anybody signed out. The logout comes
  // first because it sets the way back to the overview itself.
  router.beforeEach(async (to, from, next) => {
    if (to.meta.requiresAuth && !sessionRuns(store.state)) {
      // The logout takes the token in its first commit. What can fail after that is clearing up
      // -- storage refused in a private window, the cache -- and that must neither keep the
      // member from the form nor lose the link: both go on either way.
      if (store.state.token) {
        try {
          await store.dispatch('logout')
        } catch {
          // The sign-in is gone already; what failed was housekeeping.
        }
      }
      // fullPath, not path: it carries the query and the hash, and both are what a link
      // out of an e-mail is made of. The receipt blocks a card with ?block=<id>, the
      // reply button opens the send form in e-mail mode with ?art=email, and the
      // contribution mails jump to one entry with #contributionListItem-<id>. Whoever
      // clicks such a link is almost always signed out, so this is the normal path for
      // them, not the edge case - with `path` every one of those wishes was dropped at
      // the login and the person landed on the right page with the wish gone.
      store.commit('redirectPath', to.fullPath)
      next({ path: '/login' })
    } else {
      next()
    }
  })

  // ES-021: a project account does not create, so the whole creation area is gone for it --
  // from the menu (Sidebar.vue) and, here, from the address bar. The backend refuses the
  // calls behind that page either way (RESTRICTED_FOR_PROJECT_ACCOUNT); this only spares
  // the member a page of error toasts. `=== false`, not a falsy check: null is "not known",
  // and for not-known the answer is the one every existing account has.
  router.beforeEach((to, from, next) => {
    if (to.path.startsWith('/contributions') && store.state.creationAllowed === false) {
      next({ path: '/overview' })
    } else {
      next()
    }
  })

  // ⭐ The find map needs BOTH answers: a position is set AND it may travel to the GMS.
  // Without them there is nothing to draw and nothing to search from, so the address, a
  // bookmark and the back button all end where both answers are given. The page itself
  // used to be the only lock, and it asked the wrong question -- see mayFind.
  //
  // Read off the route record, not off the address: vue-router matches non-strictly and
  // case-insensitively while leaving `to.path` as it was typed, so `/matching/karte/` and
  // `/Matching/Karte` open the map and would slip past a string comparison. It covers the
  // list too -- the list is a LOOK of this same page (`pref.gms.map.mode`), not an address
  // of its own. /matching/position carries no flag, so it is never gated: it is where both
  // answers are given.
  router.beforeEach((to, from, next) => {
    if (to.meta.requiresFindable && !mayFind(store.state)) {
      next({ path: '/matching/position' })
    } else {
      next()
    }
  })
}

export default addNavigationGuards
