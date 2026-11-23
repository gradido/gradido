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
  }),
  { member: null, language: null },
)

/**
 * What is kept there: the token, and in `at` when this device received it, by this device's
 * clock (ms since the epoch). The session's end is counted from there with the token's lifetime
 * (`exp - iat`). Not from `iat` or `exp` themselves, which are the server's clock: a device
 * whose clock is hours off would read every session as over, or as still running.
 *
 * `at` would better be called `receivedAt`. The name stays as long as the admin and the old
 * wallet read this entry: each takes it only with a number in `at`.
 * `at` is to be set exactly at the place where the token arrives from the server.
 * `tokenMemberId` is read out of the token here, so an invalid token in localStorage is null.
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
         * A token whose middle part is not base64 of JSON, or whose `sub` is no gradidoID, is no
         * token at all: null, the wallet starts signed out.
         */
        try {
          const payload = input.token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
          return { ...input, tokenMemberId: v.parse(uuidv4Schema, JSON.parse(atob(payload)).sub) }
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
  session.set({ member, language: session.state.language })
  // auth token is set in client
}
