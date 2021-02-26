import axios from 'axios';

// TODO move this
const LOGIN_API_URL = 'http://localhost/login_api/'

// control email-text sended with email verification code
const EMAIL_TYPE = {
  DEFAULT: 2, // if user has registered directly
  ADMIN: 5, // if user was registered by an admin
}

const loginAPI = {
  login: async (email, password) => {
    const payload = {
      email,
      password,
    }
    try {
      const result = await axios.post(LOGIN_API_URL + 'unsecureLogin', payload);
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
  logout: async (session_id) => {
    const payload= { session_id }
    try {
      const result = await axios.post(LOGIN_API_URL + 'logout', payload);
      if(result.status !== 200){
        throw new Error('HTTP Status Error '+result.status)
      }
      if(result.data.state === 'error'){
        throw new Error(result.data.details)
      }
      if(result.data.state !== 'success'){
        throw new Error(result.data)
      }
      return { success: true, result }
    } catch(error){
      return { success: false, result: error}
    }
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
    try {
      const result = await axios.post(LOGIN_API_URL + 'createUser', payload);
      if(result.status !== 200){
        throw new Error('HTTP Status Error '+result.status)
      }
      if(result.data.state === 'error'){
        throw new Error(result.data.details)
      }
      if(result.data.state === 'exists'){
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
}

export default loginAPI