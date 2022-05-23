import axios from 'axios'

import { backendLogger as logger } from '@/server/logger'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const apiPost = async (url: string, payload: unknown): Promise<any> => {
  logger.trace('POST: url=' + url + ' payload=' + payload)
  return axios
    .post(url, payload)
    .then((result) => {
      logger.trace('POST-Response: result=' + result)
      if (result.status !== 200) {
        throw new Error('HTTP Status Error ' + result.status)
      }
      if (result.data.state !== 'success') {
        throw new Error(result.data.msg)
      }
      return { success: true, data: result.data }
    })
    .catch((error) => {
      return { success: false, data: error.message }
    })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const apiGet = async (url: string): Promise<any> => {
  logger.trace('GET: url=' + url)
  return axios
    .get(url)
    .then((result) => {
      logger.trace('GET-Response: result=' + result)
      if (result.status !== 200) {
        throw new Error('HTTP Status Error ' + result.status)
      }
      if (!['success', 'warning'].includes(result.data.state)) {
        throw new Error(result.data.msg)
      }
      return { success: true, data: result.data }
    })
    .catch((error) => {
      return { success: false, data: error.message }
    })
}
