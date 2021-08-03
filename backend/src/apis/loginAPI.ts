import axios from 'axios'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const apiPost = async (url: string, payload: unknown): Promise<any> => {
  return axios
    .post(url, payload)
    .then((result) => {
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
  return axios
    .get(url)
    .then((result) => {
      if (result.status !== 200) {
        throw new Error('HTTP Status Error ' + result.status)
      }
      if (!['success', 'warning'].includes(result.data.state)) {
        throw new Error(result.data.msg)
      }
      return { success: true, data: result.data }
    })
    .catch((error) => {
      // eslint-disable-next-line no-console
      console.log('IN apiGet.ERROR: ', { success: false, result: error })
      return { success: false, data: error.message }
    })
}
