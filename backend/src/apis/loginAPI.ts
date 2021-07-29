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
      return { success: true, result }
    })
    .catch((error) => {
      return { success: false, result: error }
    })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const apiGet = async (url: string): Promise<any> => {
  return axios
    .get(url)
    .then((result) => {
      if (result.status !== 200) {
        // eslint-disable-next-line no-console
        console.log('IN status: ' + 'HTTP Status Error ' + result.status)
        throw new Error('HTTP Status Error ' + result.status)
      }
      if (!['success', 'warning'].includes(result.data.state)) {
        // eslint-disable-next-line no-console
        console.log('IN state: ' + result.data.state + ' message: ' + result.data.msg)
        throw new Error(result.data.msg)
      }
      // eslint-disable-next-line no-console
      console.log('IN apiGet.THEN: ' + JSON.stringify({ success: true, result: result }))
      return { success: true, result: result }
    })
    .catch((error) => {
      // eslint-disable-next-line no-console
      console.log('IN apiGet.ERROR: ' + JSON.stringify({ success: false, result: error }))
      return { success: false, result: error }
    })
}
