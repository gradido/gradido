import axios from 'axios';
import CONFIG from '../config'

// axios.defaults.withCredentials = true ist eine Anweisung an Axios, alle Anfragen mit Anmeldeinformationen zu senden, 
// wie z. Autorisierungsheader, TLS-Client-Zertifikate oder Cookies (wie in unserem Fall).
axios.defaults.withCredentials = true

//Wir setzen unsere axios.defaults.baseURL für unsere Axios-Anfrage auf unsere. 
// Auf APIdiese Weise wird diese Basis-URL verwendet, wenn wir über Axios senden. Damit können wir nur unsere Endpunkte wie /registerund /loginzu unseren Aktionen hinzufügen, ohne jedes Mal die vollständige URL anzugeben.
axios.defaults.baseURL = CONFIG.COMMUNITY_API_STATE_BALANCE_URL

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
    return apiGet(CONFIG.COMMUNITY_API_STATE_BALANCE_URL + 'ajaxGetBalance/' + session_id)
  },
  transactions: async (session_id) => {
    return apiGet(CONFIG.COMMUNITY_API_STATE_BALANCE_URL + 'ajaxListTransactions/' + session_id)
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
    return apiPost(CONFIG.COMMUNITY_API_TRANSACTION_CREATION_URL + 'ajaxCreate/', payload)
  }
}

export default communityAPI