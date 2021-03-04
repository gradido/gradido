import axios from 'axios';

// TODO move this
const LOGIN_API_URL = 'http://localhost/login_api/'

// control email-text sended with email verification code
const EMAIL_TYPE = {
  DEFAULT: 2, // if user has registered directly
  ADMIN: 5, // if user was registered by an admin
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

const loginAPI = {
  login: async (email, password) => {
    const payload = {
      email,
      password,
    }
    return apiPost(LOGIN_API_URL + 'unsecureLogin', payload)
  },
  logout: async (session_id) => {
    const payload= { session_id }
    return apiPost(LOGIN_API_URL + 'logout', payload)
  },
  create : async (email, first_name, last_name, password) => {
    const payload = {
      email,
      first_name,
      last_name,
      password,
      emailType: EMAIL_TYPE.DEFAULT,
      login_after_register: true
    }
    return apiPost(LOGIN_API_URL + 'createUser', payload)
  },     
}

export default loginAPI