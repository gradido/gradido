// AI-GENERATED — not an architecture reference
import { useMutation } from '@vue/apollo-composable'
import { useStore } from 'vuex'
import { login, updateUserInfos } from '@/graphql/mutations'
import { clearApolloCache } from '@/plugins/apolloCache'

/**
 * Signing in: everything the wallet does with an address and a password, before and after the
 * member stands in the store. Moved here from the login page, step for step, so that the page
 * where a thank-you is accepted signs its new member in the same way (pages/TransactionLink.vue).
 *
 * What a page does around it stays the page's: where it leads afterwards, and what it says when
 * the server refuses. `signIn` throws what the mutation throws.
 */
export function useSignIn() {
  const store = useStore()
  const { mutate } = useMutation(login)
  const { mutate: mutateUpdateUserInfos } = useMutation(updateUserInfos)

  const signIn = async ({ email, password }) => {
    const result = await mutate({
      email,
      password,
      publisherId: store.state.publisherId,
      project: store.state.project,
    })
    const { login: loginResponse } = result.data
    // ⛔ Before this member is written into the store, and it is the same reason the
    // `/authenticate` guard gives: nothing here reloads the page, so every answer the
    // PREVIOUS member's queries returned is still lying in the Apollo cache. Signing in
    // over an open session is a couple of keystrokes away -- `/login` carries no
    // `requiresAuth`, so it opens while somebody is signed in -- and a query that takes no
    // variables sits under a single key for everybody. `showFriends` would hand the new
    // member the previous one's arrival BY NAME until the network caught up;
    // `firstCreationStatus` and `aliasStatus` stand on the same ground.
    //
    // At the root rather than at each query: a fetch policy can only make one reader
    // careful, and the next query written without variables would open the hole again.
    // Logging out has cleared the cache since #3759; this is the other way in.
    await clearApolloCache()
    // Capture a deliberate login-page language choice before the login action
    // consumes it, then persist it to the account so it sticks everywhere.
    const preLoginLanguage = store.state.preLoginLanguage
    // Everything the wallet needs from signing in is in this one answer, the member's own
    // picture, its visibility switch and creationAllowed included -- the login resolver
    // reads them with the user row. A verifyLogin of its own used to follow right here to
    // fetch those three; it is gone, and with it a second connection pool in the one
    // request path every member takes.
    await store.dispatch('login', loginResponse)

    if (preLoginLanguage && preLoginLanguage !== loginResponse.language) {
      try {
        await mutateUpdateUserInfos({ locale: preLoginLanguage })
      } catch (error) {
        // best effort: the chosen language already applies locally
      }
    }
    // ⚠️ Correct here, and only because signing in requires the address that is IN FORCE:
    // `dbFindUserLoginByEmail` joins through `users.email_id`, so a former address cannot get
    // anybody through this form, and what was typed IS the current address. That is a fact
    // about another file, not about this line - if a former address is ever allowed to sign
    // in (the alias already works that way, deliberately), this quietly starts writing a
    // stale address into the store again. What keeps it fresh AFTERWARDS is the
    // `/authenticate` guard, which commits the address from a real `verifyLogin` answer.
    store.commit('email', email)
    // Release the field before the page changes under it: in the iPhone's home-screen app, iOS
    // kept offering the saved password after every later tap (Bernd, 28.09.2026) -- the form
    // went away while its field still held the focus.
    document.activeElement?.blur()
    return loginResponse
  }

  return { signIn }
}
