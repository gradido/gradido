import net from 'node:net'
import { getLogger } from 'log4js'
import { CONFIG } from '../config'
import { LOG4JS_BASE_CATEGORY } from '../config/const'

export async function isPortOpen(
  url: string,
  timeoutMs: number = CONFIG.CONNECT_TIMEOUT_MS,
): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket()
    const { hostname, port } = new URL(url)

    // auto-destroy socket after timeout
    const timer = setTimeout(() => {
      socket.destroy()
      resolve(false)
    }, timeoutMs)

    socket.connect(Number(port), hostname, () => {
      // connection successful
      clearTimeout(timer)
      socket.end()
      resolve(true)
    })

    socket.on('error', (err: any) => {
      clearTimeout(timer)
      socket.destroy()
      const logger = getLogger(`${LOG4JS_BASE_CATEGORY}.network.isPortOpen`)
      logger.addContext('url', url)
      logger.error(`${err.message}: ${err.code}`)
      resolve(false)
    })
  })
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function isPortOpenRetry(
  url: string,
  timeoutMs: number = CONFIG.CONNECT_TIMEOUT_MS,
  delayMs: number = CONFIG.CONNECT_RETRY_DELAY_MS,
  retries: number = CONFIG.CONNECT_RETRY_COUNT,
): Promise<boolean> {
  for (let i = 0; i < retries; i++) {
    if (await isPortOpen(url, timeoutMs)) {
      return true
    }
    await wait(delayMs)
  }
  throw new Error(`${url} port is not open after ${retries} retries`)
}
