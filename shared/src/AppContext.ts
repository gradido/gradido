// AI-GENERATED — not an architecture reference
import { getLogger } from 'log4js'
import { NativeAppContext, PasswordHashingOptions, PasswordHashingStats } from 'shared-native'
import { LOG4JS_BASE_CATEGORY_NAME, PASSWORD_HASH_MAX_EXPECTED_WAIT_MS } from './const'
import { PasswordHashPriority } from './enum/PasswordHashPriority'
import { ResourceExhausted, Result } from './errorTypes'

export interface AppContextInitOptions {
  /** hex, the backend's LOGIN_APP_SECRET */
  appSecret: string
  /** hex, 32 characters, the backend's LOGIN_SERVER_KEY */
  serverKey: string
  /**
   * What is not set here comes from DEFAULT_PASSWORD_HASHING and
   * PASSWORD_HASH_MAX_EXPECTED_WAIT_MS; only tests set anything. See the native type.
   */
  passwordHashing?: Partial<PasswordHashingOptions>
}

/**
 * ⛔ For tests only: argon2id's minimums and a single thread, so a test suite does not spend
 * its time on 32 MiB derivations. A hash derived with it matches no production hash, and
 * must never be written anywhere a production login reads.
 */
export const MINIMAL_PASSWORD_HASHING: Partial<PasswordHashingOptions> = {
  opsLimit: 1,
  memLimit: 8192,
  threadCount: 1,
}

/*
 * The passworth hashing options which where used in production since start
 */
export const DEFAULT_PASSWORD_HASHING: Partial<PasswordHashingOptions> = {
  opsLimit: 10,
  memLimit: 33554432,
}

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
   * secrets (a server key that is not 16 bytes) throw here, at start, rather than on the
   * first login.
   */
  public init(options: AppContextInitOptions): void {
    if (this.native) {
      return
    }
    this.native = new NativeAppContext({
      appSecret: Buffer.from(options.appSecret, 'hex'),
      serverKey: Buffer.from(options.serverKey, 'hex'),
      passwordHashing: {
        ...DEFAULT_PASSWORD_HASHING,
        maxExpectedWaitMs: PASSWORD_HASH_MAX_EXPECTED_WAIT_MS,
        ...options.passwordHashing,
      },
    })
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
    return {
      success: false,
      error: new ResourceExhausted(
        'PasswordHashingQueue',
        'AppContext.hashPassword',
        'Server is full, please try again in 10 minutes.',
      ),
    }
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
