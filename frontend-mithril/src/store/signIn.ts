// AI-GENERATED — not an architecture reference
import { updateLanguageSchema } from '@/data/Account.schema'
import type { Member } from '@/data/Member.schema'
import { updateLanguage } from '@/graphql/account'
import { request } from '@/graphql/client'
import { setLocale } from '@/i18n'
import { login, session } from './Session'

/**
 * Takes the member the server named as signed in, in the language to show. A language chosen
 * before is saved to the account, unless another one was chosen while the texts came: that one
 * is saved by the choice itself, signed in by then, and an older save after it would undo it.
 */
export async function signInAs(member: Member) {
  // read as the answer came, before the sign-in takes it: a choice made meanwhile counts
  const { preLoginLanguage } = session.state
  login(member)
  const shown = await setLocale(session.state.language ?? member.language)
  if (shown && preLoginLanguage && preLoginLanguage !== member.language) {
    // not said where it fails: the language shown is the chosen one all the same
    await request(updateLanguage, { locale: preLoginLanguage }, updateLanguageSchema)
  }
}
