import { verifyLogin } from '../graphql/queries'
import { clearApolloCache } from '../plugins/apolloCache'
import { mayFind } from '../utils/matchingPosition'

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
          store.dispatch('login', result.data.verifyLogin)
          // The picture is not part of the login action, because the login mutation cannot
          // carry it -- verifyLogin is the only query that hands it over. Whoever holds a
          // verifyLogin result puts it in the store; here that is free, since the result
          // is already in hand.
          store.commit('avatar', result.data.verifyLogin.avatar ?? null)
          store.commit(
            'avatarVisibleToMembers',
            result.data.verifyLogin.avatarVisibleToMembers ?? null,
          )
          // Same reasoning, and this is what makes the settings page tell the truth after
          // an address change: the store's copy is only ever written where somebody holds
          // a fresh answer from the server, and this guard is the one place a member
          // passes through regularly without signing in again. Without it the page shows
          // the address of the last sign-in until the next one - a reload does not help,
          // because the store is persisted.
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

  // handle authentication
  router.beforeEach((to, from, next) => {
    if (to.meta.requiresAuth && !store.state.token) {
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
  // One path, and it covers the list too: the list is a LOOK of this same page
  // (`pref.gms.map.mode`), not an address of its own. /matching/position is a tab of the
  // matching page, so it is never gated by this.
  router.beforeEach((to, from, next) => {
    if (to.path === '/matching/karte' && !mayFind(store.state)) {
      next({ path: '/matching/position' })
    } else {
      next()
    }
  })
}

export default addNavigationGuards
