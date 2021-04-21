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
  balance: async (session_id) => {
    return apiGet(CONFIG.COMMUNITY_API_URL + 'getBalance/' + session_id)
  },
  transactions: async (session_id) => {
    return apiGet(CONFIG.COMMUNITY_API__URL + 'listTransactions/1/25/ASC/' + session_id)
  },
  /*create: async (session_id, email, amount, memo, target_date = new Date() ) => {
    const payload = {
      session_id,
      email,
      amount,
      target_date,
      memo,
      auto_sign: true,
    }
    return apiPost(CONFIG.COMMUNITY_API__URL + 'createCoins/', payload)
  },*/
  send: async (session_id, email, amount, memo) => {
    const payload = {
      session_id,
      email,
      amount,
      memo,
      auto_sign: true,
    }
    return apiPost(CONFIG.COMMUNITY_API__URL + 'sendCoins/', payload)
  },
}

export default communityAPI
