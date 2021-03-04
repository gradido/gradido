import axios from 'axios';

// TODO move this
const COMMUNITY_API_STATE_BALANCE_URL = 'http://localhost/state-balances/'
const COMMUNITY_API_TRANSACTION_CREATION_URL = 'http://localhost/transaction-creations/'

const apiGet = async (url) => {
  try {
    const result = await axios.get(url);
    if(result.status !== 200){
      throw new Error('HTTP Status Error '+result.status)
    }
    if(result.data.state !== 'success'){
      throw new Error(result.data.msg)
    }
    return { success: true, result }
  } catch(error){
    return { success: false, result: error}
  }
}

const apiPost = async (url, payload) => {
  try {
    const result = await axios.post(url, payload);
    if(result.status !== 200){
      throw new Error('HTTP Status Error '+result.status)
    }
    if(result.data.state !== 'success'){
      throw new Error(result.data.msg)
    }
    return { success: true, result }
  } catch(error){
    return { success: false, result: error}
  }
}

const communityAPI = {
  balance: async (session_id) => {
    return apiGet(COMMUNITY_API_STATE_BALANCE_URL + 'ajaxGetBalance/' + session_id)
  },
  transactions: async (session_id) => {
    return apiGet(COMMUNITY_API_STATE_BALANCE_URL + 'ajaxListTransactions/' + session_id)
  },
  create: async (session_id, email, amount, memo, target_date = new Date() ) => {
    const payload = {
      session_id,
      email,
      amount,
      target_date, 
      memo,
      auto_sign: true
    }
    return apiPost(COMMUNITY_API_TRANSACTION_CREATION_URL + 'ajaxCreate/', payload)
  }
}

export default communityAPI