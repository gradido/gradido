// AI-GENERATED — not an architecture reference
import { CONFIG } from '@admin/config'
import { redirectTo } from '@admin/utils/redirect'
import { type DocumentNode, print } from 'graphql'
import m from 'mithril'
import type { Result } from 'shared'
import { isSchemaMismatch } from '@/data/AppOutdated.logic'
import { adminStore, logout, setToken } from '@/store/admin.store'
import { markAppOutdated } from '@/store/appOutdated.store'

/** The server answered with errors, or did not answer at all (`messages` then holds why). */
export class GraphqlRequestError extends Error {
  constructor(public readonly messages: string[]) {
    // joined as Apollo joined them, which the old admin showed
    super(messages.join('\n'))
    this.name = 'GraphqlRequestError'
  }
}

type Answer<T> = { data?: T; errors?: { message: string; extensions?: { code?: unknown } }[] }

// The certificate of the session was revoked: the session is over, in both apps.
const REVOKED = '403.13 - Client certificate revoked'

/**
 * Sends `document` to the backend, as the moderator signed in. A token the server renews in the
 * `token` header is kept. m.request redraws once the answer is handled.
 *
 * As Apollo did before: an answer with errors is a failure, whatever data it carries.
 */
export const graphqlRequest = async <T>(
  document: DocumentNode,
  variables: Record<string, unknown> = {},
): Promise<Result<T, GraphqlRequestError>> => {
  try {
    const { answer, token } = await m.request({
      method: 'POST',
      url: CONFIG.GRAPHQL_URI,
      body: { query: print(document), variables },
      headers: {
        Authorization: adminStore.token ? `Bearer ${adminStore.token}` : '',
        clientTimezoneOffset: String(new Date().getTimezoneOffset()),
      },
      // with `extract` m.request leaves the status to us: GraphQL errors come with any of them
      extract: (xhr) => ({
        answer: JSON.parse(xhr.responseText) as Answer<T>,
        token: xhr.getResponseHeader('token'),
      }),
    })
    // a tab open across a deploy: AppOutdatedBar offers the reload
    if (isSchemaMismatch(answer.errors ?? [])) {
      markAppOutdated()
    }
    if (answer.errors?.[0]?.message === REVOKED) {
      logout()
      redirectTo(CONFIG.WALLET_LOGIN_URL)
    } else if (token) {
      setToken(token)
    }
    return answer.errors || !answer.data
      ? {
          success: false,
          error: new GraphqlRequestError(answer.errors?.map(({ message }) => message) ?? []),
        }
      : { success: true, value: answer.data }
  } catch (error) {
    // no answer, or none that is JSON
    return { success: false, error: new GraphqlRequestError([String(error)]) }
  }
}
