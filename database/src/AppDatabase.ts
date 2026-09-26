import { randomUUID } from 'node:crypto'
import { drizzle, MySql2Database } from 'drizzle-orm/mysql2'
import Redis from 'ioredis'
import { getLogger } from 'log4js'
import { Connection, createConnection, createPool, Pool } from 'mysql2/promise'
import { DataSource as DBDataSource, FileLogger } from 'typeorm'
import { latestDbVersion } from '.'
import { CONFIG } from './config'
import { LOG4JS_BASE_CATEGORY_NAME } from './config/const'
import { entities, Migration } from './entity'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.AppDatabase`)

export class AppDatabase {
  private static instance: AppDatabase
  private dataSource: DBDataSource | undefined
  private drizzleDataSource: MySql2Database | undefined
  private drizzlePool: Pool | undefined
  private redisClient: Redis | undefined
  // A connection which has subscribed to a channel may only send subscribe commands, so
  // pub/sub needs its own. One for all channels, the messages are dispatched per channel.
  private redisSubscriber: Redis | undefined
  private readonly channelHandlers = new Map<string, Set<(message: string) => void>>()
  // Per channel the SUBSCRIBE sent to Redis, resolved once Redis has confirmed it.
  // Removed again if it fails, so the next subscribe() sends a new one.
  private readonly channelSubscriptions = new Map<string, Promise<void>>()
  // Marks the messages this process publishes: they reach its own handlers right away,
  // so the copy coming back from Redis is dropped.
  private readonly pubSubSender = randomUUID()
  private defaultBatchSize: number = 100

  /**
   * The Singleton's constructor should always be private to prevent direct
   * construction calls with the `new` operator.
   */
  private constructor() {}

  /**
   * The static method that controls the access to the singleton instance.
   *
   * This implementation let you subclass the Singleton class while keeping
   * just one instance of each subclass around.
   */
  public static getInstance(): AppDatabase {
    if (!AppDatabase.instance) {
      AppDatabase.instance = new AppDatabase()
    }
    return AppDatabase.instance
  }

  public isConnected(): boolean {
    return this.dataSource?.isInitialized ?? false
  }

  public getDataSource(): DBDataSource {
    if (!this.dataSource) {
      throw new Error('Connection not initialized')
    }
    return this.dataSource
  }

  public getDrizzleDataSource(): MySql2Database {
    if (!this.drizzlePool) {
      throw new Error('Drizzle connection pool not initialized')
    }
    return drizzle(this.drizzlePool)
  }

  public getDefaultBatchSize(): number {
    return this.defaultBatchSize
  }
  public changeDefaultBatchSize(size: number): void {
    this.defaultBatchSize = size
  }

  // create database connection, initialize with automatic retry and check for correct database version
  public async init(): Promise<void> {
    if (this.dataSource?.isInitialized) {
      return
    }
    if (!this.dataSource) {
      this.dataSource = new DBDataSource({
        type: 'mysql',
        legacySpatialSupport: false,
        host: CONFIG.DB_HOST,
        port: CONFIG.DB_PORT,
        username: CONFIG.DB_USER,
        password: CONFIG.DB_PASSWORD,
        database: CONFIG.DB_DATABASE,
        entities,
        synchronize: false,
        logging: CONFIG.TYPEORM_LOGGING_ACTIVE,
        logger: CONFIG.TYPEORM_LOGGING_ACTIVE
          ? new FileLogger('all', {
              // workaround to let previous path working, because with esbuild the script root path has changed
              logPath: (CONFIG.PRODUCTION ? '../' : '') + CONFIG.TYPEORM_LOGGING_RELATIVE_PATH,
            })
          : undefined,
        extra: {
          charset: 'utf8mb4_unicode_ci',
        },
      })
    }

    // retry connection on failure some times to allow database to catch up
    for (let attempt = 1; attempt <= CONFIG.DB_CONNECT_RETRY_COUNT; attempt++) {
      try {
        await this.dataSource.initialize()
        if (this.dataSource.isInitialized) {
          logger.info(`Database connection established on attempt ${attempt}`)
          break
        }
      } catch (error) {
        logger.warn(`Attempt ${attempt} failed to connect to DB:`, error)
        await new Promise((resolve) => setTimeout(resolve, CONFIG.DB_CONNECT_RETRY_DELAY_MS))
      }
    }
    if (!this.dataSource?.isInitialized) {
      throw new Error('Could not connect to database')
    }
    // check for correct database version
    await this.checkDBVersion()

    this.redisClient = new Redis(CONFIG.REDIS_URL)
    logger.info('Redis status=', this.redisClient.status)
    this.redisSubscriber = this.redisClient.duplicate()
    this.redisSubscriber.on('message', (channel: string, raw: string) => {
      const { sender, message } = parsePubSubMessage(raw)
      if (sender !== this.pubSubSender) {
        this.deliver(channel, message)
      }
    })

    if (!this.drizzleDataSource) {
      this.drizzlePool = createPool({
        host: CONFIG.DB_HOST,
        user: CONFIG.DB_USER,
        password: CONFIG.DB_PASSWORD,
        database: CONFIG.DB_DATABASE,
        port: CONFIG.DB_PORT,
        waitForConnections: true,
        connectionLimit: 20,
        queueLimit: 100,
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000,
        // ⛔ Both of these, and they are not tuning — without them mysql2 hands every
        // BIGINT column back as a JS NUMBER, which cannot hold every integer above 2^53.
        // The value is not rounded visibly or reported anywhere; it simply comes back as a
        // different number than the one that was stored.
        //
        // Measured on 17.08.2026, and it cost an evening: a thank-you-card PIN is the full
        // 64 bit word `crypto_shorthash` returns, and only 2^53 of the 2^64 possible values
        // are small enough to survive — one in 2048. So it is not a coin flip, it is
        // **99.95% of all PINs**. Written 18446744073709551557, read back
        // 18446744073709551616 — rounded to a clean 2^64. Every payment with such a PIN was
        // refused, the attempts counted down, and the card blocked, while the person at the
        // till typed the right digits.
        //
        // ⚠️ Signing in was never affected: passwords are read through TypeORM, on the
        // other connection. That is exactly why this hid for a day — the same derivation,
        // stored the same way, works in one place and not in the other.
        supportBigNumbers: true,
        bigNumberStrings: true,
      })
    }
  }

  public async destroy(): Promise<void> {
    await Promise.all([this.dataSource?.destroy(), this.drizzlePool?.end()])
    this.dataSource = undefined
    this.drizzlePool = undefined
    if (this.redisClient) {
      await this.redisClient.quit()
      this.redisClient = undefined
    }
    if (this.redisSubscriber) {
      await this.redisSubscriber.quit()
      this.redisSubscriber = undefined
    }
    this.channelHandlers.clear()
    this.channelSubscriptions.clear()
  }

  public getRedisClient(): Redis {
    if (!this.redisClient) {
      throw new Error('Redis client not initialized')
    }
    return this.redisClient
  }

  /**
   * Calls handler for every message published on channel, by any process, until destroy().
   * Subscribing the same handler to the same channel again changes nothing.
   *
   * The handler is registered at once, messages published by this process reach it from
   * then on. Messages of other processes only arrive once Redis has confirmed the
   * subscription, which the returned promise reports. It rejects if subscribing failed;
   * the failure is logged here already, and the next call tries again.
   */
  public subscribe(channel: string, handler: (message: string) => void): Promise<void> {
    if (!this.redisSubscriber) {
      throw new Error('Redis subscriber not initialized')
    }
    const handlers = this.channelHandlers.get(channel)
    if (handlers) {
      handlers.add(handler)
    } else {
      this.channelHandlers.set(channel, new Set([handler]))
    }
    const existing = this.channelSubscriptions.get(channel)
    if (existing) {
      return existing
    }
    // while Redis is unreachable ioredis queues the command, so this may take a while
    const subscription = this.redisSubscriber.subscribe(channel).then(() => undefined)
    this.channelSubscriptions.set(channel, subscription)
    subscription.catch((error) => {
      logger.error(`Redis subscribe to channel ${channel} failed:`, error)
      if (this.channelSubscriptions.get(channel) === subscription) {
        this.channelSubscriptions.delete(channel)
      }
    })
    return subscription
  }

  /**
   * Publishes message on channel to every subscribed process, this one included.
   * The handlers of this process are called right away, without Redis; they still are
   * when Redis is unreachable or not initialized.
   * To the other processes best effort: not awaited and a failure is only logged, pub/sub
   * does not guarantee delivery anyway. Whoever relies on it needs a fallback, like the
   * timeout of a cache.
   */
  public publish(channel: string, message: string = ''): void {
    this.deliver(channel, message)
    if (!this.redisClient) {
      return
    }
    this.redisClient
      .publish(channel, JSON.stringify({ sender: this.pubSubSender, message }))
      .catch((error) => logger.error(`Redis publish on channel ${channel} failed:`, error))
  }

  // ######################################
  // private methods
  // ######################################

  private deliver(channel: string, message: string): void {
    for (const handler of this.channelHandlers.get(channel) ?? []) {
      handler(message)
    }
  }

  private async checkDBVersion(): Promise<void> {
    const [dbVersion] = await Migration.find({ order: { version: 'DESC' }, take: 1 })
    if (!dbVersion) {
      throw new Error('Could not find database version')
    }
    if (!dbVersion.fileName.startsWith(latestDbVersion)) {
      throw new Error(
        `Wrong database version detected - the backend requires '${latestDbVersion}' but found '${
          dbVersion.fileName
        }`,
      )
    }
  }
}

export const getDataSource = () => AppDatabase.getInstance().getDataSource()
export const drizzleDb = () => AppDatabase.getInstance().getDrizzleDataSource()

/**
 * What arrives over Redis: normally `{ sender, message }` as publish() sends it. Anything
 * else was published by someone other than an AppDatabase, e.g. by hand with redis-cli,
 * and counts as a message of another process as it is.
 */
function parsePubSubMessage(raw: string): { sender?: string; message: string } {
  try {
    const parsed: unknown = JSON.parse(raw)
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'sender' in parsed &&
      'message' in parsed &&
      typeof parsed.sender === 'string' &&
      typeof parsed.message === 'string'
    ) {
      return { sender: parsed.sender, message: parsed.message }
    }
  } catch {
    // not JSON, see above
  }
  return { message: raw }
}
