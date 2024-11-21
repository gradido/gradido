/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Agent } from 'http'
import { Agent as HttpsAgent } from 'https'

import axios from 'axios'

import { LogError } from '@/server/LogError'
import { backendLogger as logger } from '@/server/logger'

const httpAgent = new Agent({ keepAlive: true })
const httpsAgent = new HttpsAgent({ keepAlive: true })

export const apiPost = async (url: string, payload: unknown): Promise<any> => {
  logger.trace('POST', url, payload)
  try {
    const result = await axios.post(url, payload, { httpAgent, httpsAgent })
    logger.trace('POST-Response', result)
    if (result.status !== 200) {
      throw new LogError('HTTP Status Error', result.status)
    }
    if (result.data.state !== 'success') {
      throw new LogError(result.data.msg)
    }
    return { success: true, data: result.data }
  } catch (error: any) {
    return { success: false, data: error.message }
  }
}

export const apiGet = async (url: string): Promise<any> => {
  logger.trace('GET: url=' + url)
  try {
    const result = await axios.get(url, { httpAgent, httpsAgent })
    logger.trace('GET-Response', result)
    if (result.status !== 200) {
      throw new LogError('HTTP Status Error', result.status)
    }
    if (!['success', 'warning'].includes(result.data.state)) {
      throw new LogError(result.data.msg)
    }
    return { success: true, data: result.data }
  } catch (error: any) {
    return { success: false, data: error.message }
  }
}
