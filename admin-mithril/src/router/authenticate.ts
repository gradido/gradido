// AI-GENERATED — not an architecture reference
import { CONFIG } from '@admin/config'
import { verifyLogin } from '@admin/graphql/verifyLogin'
import { takeHandedOverToken } from '@admin/utils/authToken'
import m from 'mithril'
import * as v from 'valibot'
import { moderatorSchema } from '@/data/Moderator.schema'
import { graphqlRequest } from '@/graphql/client'
import { setLocale } from '@/i18n'
import { setModerator, setToken } from '@/store/admin.store'
import { pageAfterSignIn } from './pageAfterSignIn'

const goTo = (path: string) => m.route.set(path, undefined, { replace: true })

/**
 * Signs in on /authenticate with the token the wallet hands over, and goes on to the page it
 * names, or to the start. Whoever the server does not confirm as a moderator lands on not-found.
 *
 * ⛔ The token comes out of localStorage where the wallet shares this origin, and out of the
 * address only where it does not (authToken.ts).
 */
export const authenticate = async (
  { token: inAddress, redirect }: Record<string, unknown>,
  knownPaths: string[],
) => {
  const token = takeHandedOverToken(inAddress, CONFIG.WALLET_AUTH_URL)
  if (!token) {
    goTo('/not-found')
    return
  }
  setToken(token)
  const answer = await graphqlRequest<{ verifyLogin: unknown }>(verifyLogin)
  const moderator = answer.success
    ? v.safeParse(moderatorSchema, answer.value.verifyLogin)
    : undefined
  if (!moderator?.success || !moderator.output.role) {
    goTo('/not-found')
    return
  }
  await setLocale(moderator.output.language)
  setModerator(moderator.output)
  goTo(pageAfterSignIn(redirect, knownPaths) ?? '/')
}
