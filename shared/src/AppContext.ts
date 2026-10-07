// AI-GENERATED — not an architecture reference
import { NativeAppContext, PasswordHashingOptions } from 'shared-native'
import { PasswordHashPriority } from './enum/PasswordHashPriority'
import { ResourceExhausted, Result } from './errorTypes'

export interface AppContextInitOptions {
  /** hex, the backend's LOGIN_APP_SECRET */
  appSecret: string
  /** hex, 32 characters, the backend's LOGIN_SERVER_KEY */
  serverKey: string
  /** Only tests set this; the production difficulty is the native default. See the type. */
  passwordHashing?: PasswordHashingOptions
}

/**
 * ⛔ For tests only: argon2id's minimums and a single thread, so a test suite does not spend
 * its time on 32 MiB derivations. A hash derived with it matches no production hash, and
 * must never be written anywhere a production login reads.
 */
export const MINIMAL_PASSWORD_HASHING: PasswordHashingOptions = {
  opsLimit: 1,
  memLimit: 8192,
  threadCount: 1,
}

/*
 * The passworth hashing options which where used in production since start
 */
export const DEFAULT_PASSWORD_HASHING: PasswordHashingOptions = {
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
      passwordHashing: options.passwordHashing,
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
   * The password derivation on the hashing threads. Whether the job took a place in its
   * queue is known at once and is the result; the key comes with the promise. A full queue
   * is an expected failure: the server is busy, the caller is told to try again later.
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
    return {
      success: false,
      error: new ResourceExhausted(
        'PasswordHashingQueue',
        'AppContext.hashPassword',
        'Server is full, please try again in 10 minutes.',
      ),
    }
  }

  /** The thank-you-card PIN derivation; microseconds, on the calling thread */
  public derivePinKey(salt: string, pin: string): bigint {
    return this.getNative().derivePinKey(salt, pin)
  }
}
