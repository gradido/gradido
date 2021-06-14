import axios from 'axios'
import CONFIG from '../config'
// eslint-disable-next-line no-unused-vars
import regeneratorRuntime from 'regenerator-runtime'

// control email-text sended with email verification code
const EMAIL_TYPE = {
  DEFAULT: 2, // if user has registered directly
  ADMIN: 5, // if user was registered by an admin
}

const apiGet = async (url) => {
  try {
    const result = await axios.get(url)
    if (result.status !== 200) {
      throw new Error('HTTP Status Error ' + result.status)
    }
    if (!['success', 'warning'].includes(result.data.state)) {
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
    if (result.data.state === 'warning') {
      return { success: true, result: result.error }
    }
    if (result.data.state !== 'success') {
      throw new Error(result.data.msg)
    }
    return { success: true, result }
  } catch (error) {
    return { success: false, result: error }
  }
}

const loginAPI = {
  login: async (email, password) => {
    const payload = {
      email,
      password,
    }
    return apiPost(CONFIG.LOGIN_API_URL + 'unsecureLogin', payload)
  },
  logout: async (sessionId) => {
    const payload = { session_id: sessionId }
    return apiPost(CONFIG.LOGIN_API_URL + 'logout', payload)
  },
  create: async (email, firstName, lastName, password) => {
    const payload = {
      email,
      first_name: firstName,
      last_name: lastName,
      password,
      emailType: EMAIL_TYPE.DEFAULT,
      login_after_register: true,
    }
    return apiPost(CONFIG.LOGIN_API_URL + 'createUser', payload)
  },
  sendEmail: async (email, email_text = 7, email_verification_code_type = 'resetPassword') => {
    const payload = {
      email,
      email_text,
      email_verification_code_type,
    }
    return apiPost(CONFIG.LOGIN_API_URL + 'sendEmail', payload)
  },
  loginViaEmailVerificationCode: async (optin) => {
    return apiGet(
      CONFIG.LOGIN_API_URL + 'loginViaEmailVerificationCode?emailVerificationCode=' + optin,
    )
  },
  getUserInfos: async (sessionId, email) => {
    const payload = {
      session_id: sessionId,
      email: email,
      ask: ['user.first_name', 'user.last_name'],
    }
    return apiPost(CONFIG.LOGIN_API_URL + 'getUserInfos', payload)
  },
  updateUserInfos: async (sessionId, email, data) => {
    const payload = {
      session_id: sessionId,
      email,
      update: {
        'User.first_name': data.firstName,
        'User.last_name': data.lastName,
        'User.description': data.description,
      },
    }
    return apiPost(CONFIG.LOGIN_API_URL + 'updateUserInfos', payload)
  },
  changePassword: async (sessionId, email, password) => {
    const payload = {
      session_id: sessionId,
      email,
      update: {
        'User.password': password,
      },
    }
    return apiPost(CONFIG.LOGIN_API_URL + 'updateUserInfos', payload)
  },
  changePasswordProfile: async (sessionId, email, password, passwordNew) => {
    const payload = {
      session_id: sessionId,
      email,
      update: {
        'User.password': password,
        'User.passwordNew': passwordNew,
      },
    }
    return apiPost(CONFIG.LOGIN_API_URL + 'updateUserInfos', payload)
  },
  changeUsernameProfile: async (sessionId, email, username) => {
    const payload = {
      session_id: sessionId,
      email,
      update: {
        'User.username': username,
      },
    }
    return apiPost(CONFIG.LOGIN_API_URL + 'updateUserInfos', payload)
  },
  updateLanguage: async (sessionId, email, language) => {
    const payload = {
      session_id: sessionId,
      email,
      update: {
        'User.language': language,
      },
    }
    return apiPost(CONFIG.LOGIN_API_URL + 'updateUserInfos', payload)
  },
  checkUsername: async (username, groupId = 1) => {
    return apiGet(CONFIG.LOGIN_API_URL + `checkUsername?username=${username}&group_id=${groupId}`)
  },
}

export default loginAPI
