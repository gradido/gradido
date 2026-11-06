// AI-GENERATED — not an architecture reference

/**
 * The way out of a page that brings its own back arrow -- the calculator, the scanner, the
 * member's own codes. On a phone these pages are bare, so the arrow is the ONLY way out.
 *
 * Back to wherever the page was opened from, with two exceptions that both land on the
 * overview instead:
 *
 * - **No wallet history.** A deep link or a bookmark: `state.back` is null, and a bare
 *   history step would walk out of the wallet, to whatever the browser had open before.
 * - **The step back leaves the signed-in wallet.** When a session has run out, the guard
 *   sends the member to the sign-in form and the form sends them on to the page they
 *   wanted -- so the entry behind such a page IS the form. Stepping back showed the form
 *   to somebody signed in, signing in led to the same page again, and on a phone there was
 *   no third way: a loop (Bernd, 08.10.2026). Any page that needs no sign-in is not a
 *   place to go "back" to from inside the wallet.
 *
 * `state.back` is the full path vue-router noted for the entry behind this one; the matched
 * record says whether that page belongs to the signed-in wallet. A path that no longer
 * resolves is treated like no history.
 */
export const backOrOverview = (router) => backOrOverviewUnless(router, null)

/**
 * `backOrOverview`, with one more exception: an entry behind this one that is the page
 * `routeName` itself leads to the overview as well.
 *
 * For the send form's "Zurück" (E-043, with `'Send'`), which leaves the form and never walks
 * through it. The form stands beside the column of contacts and under the strip of favourites,
 * and a tap there patches it to another recipient: the entry behind it is then the form for the
 * one before, and stepping back would hand the member the previous recipient instead of the way
 * out. Where the form was opened from one of the windows, it knows that window's place
 * (useSendReturn) and does not ask here.
 */
export const backOrOverviewUnless = (router, routeName) => {
  const back = router.options.history.state?.back
  if (back && staysInWallet(router, back) && !isPage(router, back, routeName)) {
    router.back()
  } else {
    router.push('/overview')
  }
}

/** Whether `path` resolves to the route named `routeName`. False where no name is given. */
const isPage = (router, path, routeName) => {
  if (!routeName) return false
  try {
    return router.resolve(path).name === routeName
  } catch {
    return false
  }
}

/**
 * Whether the entry behind this one (`history.state.back`) is a page of the signed-in wallet.
 * False for no entry at all. Exported for pages whose "back" has another landing than the
 * overview -- the thank-you greeting leaves to the page of the two doors.
 */
export const staysInWallet = (router, path) => {
  if (!path) return false
  try {
    return Boolean(router.resolve(path).meta?.requiresAuth)
  } catch {
    return false
  }
}
