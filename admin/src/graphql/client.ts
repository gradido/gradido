// AI-GENERATED — not an architecture reference

import { type DocumentNode, print } from 'graphql'
import m from 'mithril'
import type { Result } from 'shared'
import { CONFIG } from '@/config'
import { adminStore, logout, setToken } from '@/store/admin.store'
import { appOutdated } from '@/store/appOutdated.store'
import { redirectTo } from '@/utils/redirect'

/** The server answered with errors, or did not answer at all (`messages` then holds why). */
export class GraphqlRequestError extends Error {
  constructor(public readonly messages: string[]) {
    // joined as Apollo joined them, which the old admin showed
    super(messages.join('\n'))
    this.name = 'GraphqlRequestError'
  }
}

type Answer<T> = { data?: T; errors?: { message: string; extensions?: { code?: unknown } }[] }

// The certificate of the session was revoked, or it ran out: the session is over, in both apps.
export const REVOKED = '403.13 - Client certificate revoked'

/**
 * Sends `document` to the backend, as the moderator signed in. A token the server renews in the
 * `token` header is kept. m.request redraws once the answer is handled.
 *
 * `background`: a question the moderator did not ask (the number at the face, walletNews.store).
 * It keeps the session's clock where the moderator left it -- the renewed token is not taken, as
 * the wallet's beat does not take it (`renewSession: false`) -- and leaves an ended session to the
 * moderator's next own request, as before; nor does it redraw.
 *
 * As Apollo did before: an answer with errors is a failure, whatever data it carries.
 */
export const graphqlRequest = async <T>(
  document: DocumentNode,
  variables: Record<string, unknown> = {},
  { background = false }: { background?: boolean } = {},
): Promise<Result<T, GraphqlRequestError>> => {
  try {
    const { answer, token } = await m.request({
      background,
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
    // The documents no longer fit the server's schema, in a tab open across a deploy:
    // AppOutdatedBar offers the reload.
    if (answer.errors?.some(({ extensions }) => extensions?.code === 'GRAPHQL_VALIDATION_FAILED')) {
      appOutdated.value = true
    }
    // in the background the moderator did nothing: neither the session's end nor its renewal is
    // this answer's
    if (!background && answer.errors?.[0]?.message === REVOKED) {
      logout()
      redirectTo(CONFIG.WALLET_LOGIN_URL)
    } else if (!background && token) {
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
