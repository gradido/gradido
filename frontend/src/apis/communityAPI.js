import axios from 'axios'
import CONFIG from '../config'

const apiGet = async (url) => {
  try {
    const result = await axios.get(url)
    if (result.status !== 200) {
      throw new Error('HTTP Status Error ' + result.status)
    }
    if (result.data.state !== 'success') {
      throw new Error(result.data.msg)
    }
    return { success: true, result }
  } catch (error) {
    return { success: false, result: error }
  }
}

const apiPost = async (url, payload) => {
  try {
    const result = await axios.post(url, payload)
    if (result.status !== 200) {
      throw new Error('HTTP Status Error ' + result.status)
    }
    if (result.data.state !== 'success') {
      throw new Error(result.data.msg)
    }
    return { success: true, result }
  } catch (error) {
    return { success: false, result: error }
  }
}

const communityAPI = {
  balance: async (sessionId) => {
    return apiGet(CONFIG.COMMUNITY_API_URL + 'getBalance/' + sessionId)
  },
  transactions: async (sessionId, firstPage = 1, items = 1000, order = 'DESC') => {
    return apiGet(
      `${CONFIG.COMMUNITY_API_URL}listTransactions/${firstPage}/${items}/${order}/${sessionId}`,
    )
  },
  /* create: async (sessionId, email, amount, memo, target_date = new Date() ) => {
    const payload = {
      sessionId,
      email,
      amount,
      target_date,
      memo,
      auto_sign: true,
    }
    return apiPost(CONFIG.COMMUNITY_API__URL + 'createCoins/', payload)
  }, */
  send: async (sessionId, data) => {
    const payload = {
      session_id: sessionId,
      auto_sign: true,
      ...data,
    }
    return apiPost(CONFIG.COMMUNITY_API_URL + 'sendCoins/', payload)
  },
}

export default communityAPI
