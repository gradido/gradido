import { Mutex } from 'async-mutex'
import { Subprocess, spawn } from 'bun'
import { getLogger, Logger } from 'log4js'
import { CONFIG } from '../../config'
import {
  GRADIDO_NODE_KILL_TIMEOUT_MILLISECONDS,
  GRADIDO_NODE_MIN_RUNTIME_BEFORE_EXIT_MILLISECONDS,
  GRADIDO_NODE_MIN_RUNTIME_BEFORE_RESTART_MILLISECONDS,
  GRADIDO_NODE_RUNTIME_PATH,
  LOG4JS_BASE_CATEGORY,
} from '../../config/const'
import { delay } from '../../utils/time'
import path from 'node:path'
/**
 * A Singleton class defines the `getInstance` method that lets clients access
 * the unique singleton instance.
 *
 * Singleton Managing GradidoNode if started as subprocess
 * will restart GradidoNode if it exits more than `GRADIDO_NODE_MIN_RUNTIME_BEFORE_RESTART_MILLISECONDS` milliseconds after start
 * if exit was called, it will first try to exit graceful with SIGTERM and then kill with SIGKILL after `GRADIDO_NODE_KILL_TIMEOUT_MILLISECONDS` milliseconds
 */
export class GradidoNodeProcess {
  private static instance: GradidoNodeProcess | null = null
  private proc: Subprocess | null = null
  private logger: Logger
  private lastStarted: Date | null = null
  private exitCalled: boolean = false
  private restartMutex: Mutex = new Mutex()

  private constructor() {
    // constructor is private to prevent instantiation from outside
    // of the class except from the static getInstance method.
    this.logger = getLogger(`${LOG4JS_BASE_CATEGORY}.client.GradidoNodeProcess`)
  }

  /**
   * Static method that returns the singleton instance of the class.
   * @returns the singleton instance of the class.
   */
  public static getInstance(): GradidoNodeProcess {
    if (!GradidoNodeProcess.instance) {
      GradidoNodeProcess.instance = new GradidoNodeProcess()
    }
    return GradidoNodeProcess.instance
  }

  public static getRuntimePathFileName(): string {
    const isWindows = process.platform === 'win32'
    const binaryName = isWindows ? 'GradidoNode.exe' : 'GradidoNode'

    return path.join(
      __dirname,
      '..',
      '..',
      'gradido_node',
      'bin',
      binaryName,
    )
  }

  public start() {
    if (this.proc) {
      this.logger.warn('GradidoNodeProcess already running.')
      return
    }
    this.logger.info(`starting GradidoNodeProcess with path: ${GRADIDO_NODE_RUNTIME_PATH}`)
    this.lastStarted = new Date()
    const logger = this.logger
    this.proc = spawn([GRADIDO_NODE_RUNTIME_PATH], {
      env: {
        CLIENTS_HIERO_NETWORKTYPE: CONFIG.HIERO_HEDERA_NETWORK,
        SERVER_JSON_RPC_PORT: CONFIG.DLT_NODE_SERVER_PORT.toString(),
        USERPROFILE: CONFIG.DLT_GRADIDO_NODE_SERVER_HOME_FOLDER,
        HOME: CONFIG.DLT_GRADIDO_NODE_SERVER_HOME_FOLDER,
        UNSECURE_ALLOW_CORS_ALL: CONFIG.DLT_GRADIDO_NODE_SERVER_ALLOW_CORS ? '1' : '0',
      },
      onExit(_proc, exitCode, signalCode, error) {
        logger.warn(`GradidoNodeProcess exited with code ${exitCode} and signalCode ${signalCode}`)
        if (error) {
          logger.error(`GradidoNodeProcess exit error: ${error}`)
          /*if (logger.isDebugEnabled() && proc.stderr) {
            // print error messages from GradidoNode in our own log if debug is enabled
            proc.stderr
              .getReader()
              .read()
              .then((chunk) => {
                logger.debug(chunk.value?.toString())
              })
          }*/
        }
        const gradidoNodeProcess = GradidoNodeProcess.getInstance()
        gradidoNodeProcess.proc = null
        if (
          !gradidoNodeProcess.exitCalled &&
          gradidoNodeProcess.lastStarted &&
          Date.now() - gradidoNodeProcess.lastStarted.getTime() >
            GRADIDO_NODE_MIN_RUNTIME_BEFORE_RESTART_MILLISECONDS
        ) {
          // restart only if enough time was passed since last start to prevent restart loop
          gradidoNodeProcess.start()
        }
      },
      /*stdout: 'ignore',
      stderr: logger.isDebugEnabled() ? 'pipe' : 'ignore',*/
      stdout: 'inherit',
      stderr: 'inherit',
    })
  }

  public async restart() {
    const release = await this.restartMutex.acquire()
    try {
      if (this.proc) {
        await this.exit()
        this.exitCalled = false
        this.start()
      }
    } finally {
      release()
    }
  }

  public getLastStarted(): Date | null {
    return this.lastStarted
  }

  public async exit(): Promise<void> {
    this.exitCalled = true
    if (this.proc) {
      if (
        this.lastStarted &&
        Date.now() - this.lastStarted.getTime() < GRADIDO_NODE_MIN_RUNTIME_BEFORE_EXIT_MILLISECONDS
      ) {
        await delay(
          GRADIDO_NODE_MIN_RUNTIME_BEFORE_EXIT_MILLISECONDS -
            Date.now() -
            this.lastStarted.getTime(),
        )
      }
      this.proc.kill('SIGTERM')
      const timeout = setTimeout(() => {
        this.logger.warn(
          `GradidoNode couldn't exit graceful after ${GRADIDO_NODE_KILL_TIMEOUT_MILLISECONDS} milliseconds with SIGTERM, killing with SIGKILL`,
        )
        this.proc?.kill('SIGKILL')
      }, GRADIDO_NODE_KILL_TIMEOUT_MILLISECONDS)
      try {
        await this.proc.exited
      } catch (error) {
        this.logger.error(`GradidoNodeProcess exit error: ${error}`)
      } finally {
        clearTimeout(timeout)
      }
    } else {
      return Promise.resolve()
    }
  }
}
