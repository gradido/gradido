import CONFIG from '@frontend/config'
import { type DocumentNode, print } from 'graphql'
import m from 'mithril'
import type { Result } from 'shared/browser'
import * as v from 'valibot'
import { appOutdated } from '@/store/appOutdated'
import { authToken, authTokenSchema, logout, session } from '@/store/Session'

// What a GraphQL server answers with, whatever was asked.
const answerSchema = v.object({
  data: v.optional(v.unknown()),
  errors: v.optional(
    v.array(
      v.object({
        message: v.string(),
        extensions: v.optional(v.object({ code: v.optional(v.unknown()) })),
      }),
    ),
  ),
})

// The certificate of the session was revoked, or it ran out: the session is over, in both apps.
const REVOKED = '403.13 - Client certificate revoked'

/**
 * Sends `document` to the backend as the member signed in, and reads the answer through `schema`:
 * what the caller uses of it, with defaults where the server may send null.
 *
 * A failure the wallet is not to blame for -- no network, an error of the server, an answer that
 * does not fit -- is returned. A mistake of the caller throws: a variable `document` does not
 * declare.
 *
 * `renewSession: false`: a question the member did not ask (the chat's beat, a panel). The renewed
 * token is not taken, or a tab left open would never be signed out. `background`: no redraw.
 */
export async function request<const TSchema extends v.GenericSchema>(
  document: DocumentNode,
  variables: Record<string, unknown>,
  schema: TSchema,
  { renewSession = true, background = false } = {},
): Promise<Result<v.InferOutput<TSchema>>> {
  const declared = document.definitions.flatMap((definition) =>
    definition.kind === 'OperationDefinition'
      ? (definition.variableDefinitions ?? []).map(({ variable }) => variable.name.value)
      : [],
  )
  const unknown = Object.keys(variables).filter((name) => !declared.includes(name))
  if (unknown.length) {
    throw new Error(`the document declares no variable ${unknown.join(', ')}`)
  }
  // who asks: the session the answer belongs to
  const { member } = session.state
  const askingUserId = member?.gradidoID
  let answer: v.InferOutput<typeof answerSchema>
  let token: string | null
  try {
    ;({ answer, token } = await m.request({
      background,
      method: 'POST',
      url: CONFIG.GRAPHQL_URI,
      body: { query: print(document), variables },
      headers: {
        Authorization: authToken.state ? `Bearer ${authToken.state.token}` : '',
        clientTimezoneOffset: String(new Date().getTimezoneOffset()),
      },
      // with `extract` m.request leaves the status to us: GraphQL errors come with any of them
      extract: (xhr) => ({
        answer: v.parse(answerSchema, JSON.parse(xhr.responseText)),
        token: xhr.getResponseHeader('token'),
      }),
    }))
  } catch (error) {
    // no answer, none that is JSON, or JSON that is no GraphQL answer
    return { success: false, error: new Error(String(error)) }
  }
  // The documents no longer fit the server's schema, in a tab open across a deploy:
  // AppOutdatedBar offers the reload.
  if (answer.errors?.some(({ extensions }) => extensions?.code === 'GRAPHQL_VALIDATION_FAILED')) {
    appOutdated.value = true
  }
  if (answer.errors?.[0]?.message === REVOKED) {
    logout()
  } else if (
    (token && renewSession && askingUserId && session.state.member?.gradidoID === askingUserId) ||
    !askingUserId
  ) {
    // Only while the member who asked is still the one signed in: an answer that arrives after
    // the session ended would otherwise keep its token for the next one.
    // Or on login, without previous user
    authToken.set(v.parse(authTokenSchema, { token, at: Date.now() }))
  }
  if (answer.errors) {
    return {
      success: false,
      error: new Error(answer.errors.map(({ message }) => message).join('\n')),
    }
  }
  const parsed = v.safeParse(schema, answer.data)
  if (!parsed.success) {
    return {
      success: false,
      error: new Error(`the answer does not fit:\n${v.summarize(parsed.issues)}`),
    }
  }
  return { success: true, value: parsed.output }
}
