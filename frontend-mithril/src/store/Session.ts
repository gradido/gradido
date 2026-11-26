import { Uuidv4, uuidv4Schema } from 'shared/browser'
import * as v from 'valibot'
import { Member, memberSchema } from '@/data/Member.schema'
import { DeviceStore, DeviceStoreBasicType } from './DeviceStore'

/** Where the wallet keeps its state in localStorage; the key of the old wallet. */
const STATE_KEY = 'gradido-frontend'

/**
 * Where the token is kept, for the wallet and the admin interface together. On a deployment
 * they share one origin and so one localStorage: a renewal in one app renews both, a logout in
 * one ends both. The admin and the old wallet read the same key, and a test in each holds it.
 */
const AUTH_TOKEN_KEY = 'auth-token'

const sessionStateSchema = v.fallback(
  v.object({
    member: v.fallback(v.nullable(memberSchema), null),
    language: v.fallback(v.nullable(v.string()), null),
    // The page asked for while nobody was signed in, with its query and hash: where the sign-in
    // goes on to. A sign-out puts the overview back.
    redirectPath: v.fallback(v.string(), '/overview'),
    // A language chosen while nobody was signed in: the next sign-in keeps it, and saves it
    // to the account, instead of taking the account's.
    preLoginLanguage: v.fallback(v.nullable(v.string()), null),
  }),
  { member: null, language: null, redirectPath: '/overview', preLoginLanguage: null },
)

// What the wallet reads out of the token's middle part; `exp` and `iat` in seconds.
const tokenPayloadSchema = v.object({
  sub: uuidv4Schema,
  exp: v.number(),
  iat: v.optional(v.number()),
})

/**
 * What is kept there: the token, and in `at` when this device received it, by this device's
 * clock (ms since the epoch). The session's end is counted from there with the token's lifetime
 * (`exp - iat`). Not from `iat` or `exp` themselves, which are the server's clock: a device
 * whose clock is hours off would read every session as over, or as still running.
 *
 * `at` would better be called `receivedAt`. The name stays as long as the admin and the old
 * wallet read this entry: each takes it only with a number in `at`.
 * `at` is to be set exactly at the place where the token arrives from the server.
 * `tokenMemberId` and `endsAt` are read out of the token here, so an invalid token in
 * localStorage is null.
 */
export const authTokenSchema = v.fallback(
  v.nullable(
    v.pipe(
      v.object({
        token: v.pipe(v.string(), v.nonEmpty()),
        at: v.pipe(v.number(), v.finite()),
      }),
      v.transform((input) => {
        /**
         * `tokenMemberId`: the gradidoID of the member `token` was issued to (its `sub`),
         * lowercased -- read, not verified: the server verifies every request.
         * `endsAt`: when the session ends by this device's clock (ms since the epoch), the
         * token's lifetime counted from `at`. A token without `iat` keeps its `exp`.
         * A token whose middle part is not base64 of JSON, or lacks one of the two, is no
         * token at all: null, the wallet starts signed out.
         */
        try {
          const payload = input.token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
          const { sub, exp, iat } = v.parse(tokenPayloadSchema, JSON.parse(atob(payload)))
          return {
            ...input,
            tokenMemberId: sub,
            endsAt: iat === undefined ? exp * 1000 : input.at + (exp - iat) * 1000,
          }
        } catch {
          return null
        }
      }),
    ),
  ),
  null,
)

export type AuthToken = v.InferOutput<typeof authTokenSchema>

export class AuthTokenStore extends DeviceStore<typeof authTokenSchema> {
  /**
   * The gradidoID of the member whose token lay in localStorage when this tab last looked, or
   * null where none lay there. Tells a renewal for the same member from somebody new signing in.
   */
  #lastSeenMemberId?: Uuidv4

  constructor() {
    super(AUTH_TOKEN_KEY, authTokenSchema, DeviceStoreBasicType.Object)
    this.#lastSeenMemberId = this.state?.tokenMemberId
  }
  set(value: AuthToken, save = true) {
    // logout
    if (this.state && !value) {
      location.assign('/login')
    }
    if (value) {
      if (this.state && value.tokenMemberId !== this.#lastSeenMemberId) {
        // reload page, this means all js state/memory will be cleared and started freshly over
        location.reload()
      }
      this.#lastSeenMemberId = value.tokenMemberId
    }
    super.set(value, save)
  }
}

export const authToken = new AuthTokenStore()
export const session = new DeviceStore(STATE_KEY, sessionStateSchema, DeviceStoreBasicType.Object)

if (!authToken.state && session.state.member) {
  logout()
}

export function logout() {
  session.set(v.parse(sessionStateSchema, { language: session.state.language }))
  authToken.set(null)
}

export function login(member: Member) {
  session.set({
    ...session.state,
    member,
    language: session.state.preLoginLanguage ?? member.language,
    preLoginLanguage: null,
  })
  // auth token is set in client
}

/**
 * Whether a session runs: a token, and more than five seconds before it ends. One that ends
 * within them would be over before the first answer.
 */
export function sessionRuns() {
  return authToken.state !== null && authToken.state.endsAt - Date.now() > 5000
}
