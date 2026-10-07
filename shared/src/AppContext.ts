import { getLogger } from 'log4js'
import { NativeAppContext, PasswordHashingStats } from 'shared-native'
import * as v from 'valibot'
import {
  DEFAULT_PASSWORD_HASHING,
  LOG4JS_BASE_CATEGORY_NAME,
  PASSWORD_HASH_MAX_EXPECTED_WAIT_MS,
} from './const'
import { PasswordHashPriority } from './enum/PasswordHashPriority'
import { ResourceExhausted, Result } from './errorTypes'
import { hexBytesSchema, positiveIntegerSchema } from './schema/base.schema'

/**
 * What the process is configured with once, at start, and does not change while it runs.
 * It holds the one native app context, where such things are kept: the secrets every
 * password and PIN derivation is keyed with, and the threads that derive password keys.
 *
 * A singleton like AppDatabase: `getInstance().init(...)` once at server start, before the
 * first login; a second init changes nothing.
 */
export class AppContext {
  private static instance: AppContext
  private native: NativeAppContext | undefined

  private constructor() {}

  public static getInstance(): AppContext {
    if (!AppContext.instance) {
      AppContext.instance = new AppContext()
    }
    return AppContext.instance
  }

  public isInitialized(): boolean {
    return this.native !== undefined
  }

  /**
   * Copies the secrets to the native side and starts the password hashing threads. Wrong
   * options (a server key that is not 16 bytes, a difficulty argon2id refuses) throw here,
   * at start, rather than on the first login; see appContextOptionsSchema.
   */
  public init(options: AppContextOptionsInput): void {
    if (this.native) {
      return
    }
    this.native = new NativeAppContext(v.parse(appContextOptionsSchema, options))
  }

  /**
   * Finishes the derivations under way, drops the waiting ones and stops the threads. The
   * next init starts a new native context. Not needed for the process to exit.
   */
  public destroy(): void {
    this.native?.destroy()
    this.native = undefined
  }

  public getNative(): NativeAppContext {
    if (!this.native) {
      throw new Error('AppContext not initialized')
    }
    return this.native
  }

  /**
   * The password derivation on the hashing threads. Whether the job was admitted is known at
   * once and is the result; the key comes with the promise. A refusal is an expected
   * failure: the server is busy, the caller is told to try again later.
   *
   * The native side reports it as a plain `{ name, message }` (shared-native's NativeError:
   * a class of this package cannot be built across the Node-API boundary). This is where it
   * becomes the ResourceExhausted the callers handle; the figures in the native message --
   * expected wait, queue, duration -- go to the log, the client gets the fixed sentence.
   */
  public hashPassword(
    salt: string,
    password: string,
    priority: PasswordHashPriority,
  ): Result<Promise<bigint>, ResourceExhausted> {
    const result = this.getNative().hashPassword(salt, password, priority)
    if (result.success) {
      return result
    }
    getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.AppContext.hashPassword`).warn(
      `password hashing refused: ${result.error.message}`,
    )
    return { success: false, error: this.passwordHashingRefusal() }
  }

  /**
   * The refusal a derivation handed in now would get, or undefined while one would be
   * admitted -- the admission rule, asked without handing in a job. For the login's fake
   * verification: an unknown address has to fail the way a known one fails under load, or
   * the quick "server is full" against the slow "no user" would tell the two apart.
   */
  public passwordHashingRefusalNow(): ResourceExhausted | undefined {
    const stats = this.getPasswordHashingStats()
    return stats.expectedWaitMs >= stats.maxExpectedWaitMs
      ? this.passwordHashingRefusal()
      : undefined
  }

  // the one failure a refused derivation is answered with, real or faked alike
  private passwordHashingRefusal(): ResourceExhausted {
    return new ResourceExhausted(
      'PasswordHashingQueue',
      'AppContext.hashPassword',
      'Server is full, please try again in 10 minutes.',
    )
  }

  /** What the hashing threads measure and hold right now; see the native type */
  public getPasswordHashingStats(): PasswordHashingStats {
    return this.getNative().getPasswordHashingStats()
  }

  /** The thank-you-card PIN derivation; microseconds, on the calling thread */
  public derivePinKey(salt: string, pin: string): bigint {
    return this.getNative().derivePinKey(salt, pin)
  }
}

/**
 * What AppContext.init takes, and parsed, what the native context is created with: the two
 * secrets as the backend's config holds them, and the options of the password hashing
 * threads. Everything left out of those is the production value; the minimums are argon2id's
 * (libsodium's crypto_pwhash_OPSLIMIT_MIN and MEMLIMIT_MIN), which the native side insists
 * on as well.
 *
 * ⛔ opsLimit and memLimit are constants of the derivation, not tuning: every hash in
 * users.password was derived with the defaults, and a hash derived with other values
 * matches no stored password. Set them for tests only, where no hash is ever compared with
 * a production one.
 */
export const appContextOptionsSchema = v.object({
  /** the backend's LOGIN_APP_SECRET */
  appSecret: v.pipe(hexBytesSchema, v.minLength(1)),
  /** the backend's LOGIN_SERVER_KEY: 16 bytes, crypto_shorthash_KEYBYTES */
  serverKey: v.pipe(hexBytesSchema, v.length(16, 'need to be 32 hex characters')),
  passwordHashing: v.optional(
    v.object({
      opsLimit: v.optional(positiveIntegerSchema, DEFAULT_PASSWORD_HASHING.opsLimit),
      memLimit: v.optional(
        v.pipe(positiveIntegerSchema, v.minValue(8192)),
        DEFAULT_PASSWORD_HASHING.memLimit,
      ),
      // the threads that derive; without it the native side takes half the logical cores
      threadCount: v.optional(positiveIntegerSchema),
      // the admission rule: a job is admitted while what is queued would be served within this
      maxExpectedWaitMs: v.optional(positiveIntegerSchema, PASSWORD_HASH_MAX_EXPECTED_WAIT_MS),
    }),
    {},
  ),
})
export type AppContextOptionsInput = v.InferInput<typeof appContextOptionsSchema>
export type AppContextOptions = v.InferOutput<typeof appContextOptionsSchema>
