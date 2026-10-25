// AI-GENERATED — not an architecture reference
import type { ApolloClient, NormalizedCacheObject } from '@apollo/client/core'
import type { Router } from 'vue-router'
import { CONFIG } from '../config'
import { verifyLogin } from '../graphql/verifyLogin'
import type { i18n as adminI18n } from '../i18n'
import type { useAdminStore } from '../store/useAdminStore'
import { takeHandedOverToken } from '../utils/authToken'

/**
 * The page a sign-in goes on to: the one the wallet names (`redirect`) when it leads back here
 * -- its bar "Zurück zum Admin" and its menu entry "Admin" after a pin, a bubble or an arrow
 * of this interface (frontend/src/utils/adminWayBack.js) --, where it is a page of this router
 * to work on; none otherwise, and the sign-in goes to the start. Never an address of another
 * site: to a browser `//host` and `/\host` are one. Never the sign-in or the sign-out, and never
 * a page the router does not know, which its catch-all would answer with "not found" -- a page
 * renamed since the press, say (coderabbit, #4200).
 */
export const pageAfterSignIn = (
  redirect: unknown,
  router: Pick<Router, 'resolve'>,
): string | null => {
  if (typeof redirect !== 'string' || !/^\/(?![/\\])/.test(redirect) || /[\\\s]/.test(redirect)) {
    return null
  }
  const page = router.resolve(redirect)
  const known = !page.matched.some(({ name }) => name === 'NotFound')
  return known && !['/authenticate', '/logout'].includes(page.path) ? redirect : null
}

export const addNavigationGuards = (
  router: Router,
  store: ReturnType<typeof useAdminStore>,
  apollo: ApolloClient<NormalizedCacheObject>,
  i18n: typeof adminI18n,
) => {
  // store token on `authenticate`
  //
  // ⛔ The token comes out of localStorage where the wallet shares this origin, and out of the
  // address only where it does not (utils/authToken.ts): on a deployment, a link with `?token=`
  // signs nobody in.
  router.beforeEach(async (to, from, next) => {
    const token =
      to.path === '/authenticate'
        ? takeHandedOverToken(to.query?.token, CONFIG.WALLET_AUTH_URL)
        : null
    if (token) {
      store.setToken(token)
      await apollo
        .query({
          query: verifyLogin,
          fetchPolicy: 'network-only',
        })
        .then((result) => {
          const moderator = result.data.verifyLogin
          if (moderator.role) {
            i18n.global.locale.value = moderator.language
            store.setModerator(moderator)
            const page = pageAfterSignIn(to.query?.redirect, router)
            // A string, so that the router reads the page's own query as well.
            next(page ?? { path: '/' })
          } else {
            next({ path: '/not-found' })
          }
        })
        .catch(() => {
          next({ path: '/not-found' })
        })
    } else {
      next()
    }
  })

  // protect all routes but `not-found`
  router.beforeEach((to, from, next) => {
    if (
      !CONFIG.DEBUG_DISABLE_AUTH && // we did not disabled the auth module for debug purposes
      (!store.token || // we do not have a token
        !store.moderator || // no moderator set in store
        !store.moderator.role) && // user is no admin
      to.path !== '/not-found' && // we are not on `not-found`
      to.path !== '/logout' // we are not on `logout`
    ) {
      next({ path: '/not-found' })
    } else {
      next()
    }
  })

  // Routes marked `requiresAdmin` are reserved for administrators. Menu visibility is a
  // convenience, not an access boundary, so the restriction is enforced here on the route
  // itself as well; the backend rights remain the final word.
  router.beforeEach((to, from, next) => {
    if (!CONFIG.DEBUG_DISABLE_AUTH && to.meta?.requiresAdmin && store.moderator?.role !== 'ADMIN') {
      next({ path: '/not-found' })
    } else {
      next()
    }
  })
}
