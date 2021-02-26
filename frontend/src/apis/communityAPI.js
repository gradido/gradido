import axios from 'axios';

// TODO move this
const COMMUNITY_API_STATE_BALANCE_URL = 'http://localhost/state-balances/'
const COMMUNITY_API_TRANSACTION_CREATION_URL = 'http://localhost/transaction-creations/'

const communityAPI = {
  balance: async (session_id) => {
    try {
      const result = await axios.get(COMMUNITY_API_STATE_BALANCE_URL + 'ajaxGetBalance/' + session_id);
      if(result.status !== 200){
        throw new Error('HTTP Status Error '+result.status)
      }
      if(result.data.state === 'error'){
        throw new Error(result.data.msg)
      }
      if(result.data.state !== 'success'){
        throw new Error(result.data)
      }
      return { success: true, result }
    } catch(error){
      return { success: false, result: error}
    }
  },
  transactions: async (session_id) => {
    try {
      const result = await axios.get(COMMUNITY_API_STATE_BALANCE_URL + 'ajaxListTransactions/' + session_id);
      if(result.status !== 200){
        throw new Error('HTTP Status Error '+result.status)
      }
      if(result.data.state === 'error'){
        throw new Error(result.data.msg)
      }
      if(result.data.state !== 'success'){
        throw new Error(result.data)
      }
      return { success: true, result }
    } catch(error){
      return { success: false, result: error}
    }
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
    try {
      const result = await axios.post(COMMUNITY_API_TRANSACTION_CREATION_URL + 'ajaxCreate/', payload);
      if(result.status !== 200){
        throw new Error('HTTP Status Error '+result.status)
      }
      if(result.data.state === 'error'){
        throw new Error(result.data.msg)
      }
      if(result.data.state !== 'success'){
        throw new Error(result.data)
      }
      return { success: true, result }
    } catch(error){
      return { success: false, result: error}
    }
  }
}

export default communityAPI