import axios from 'axios'
import { graphql } from 'graphql'
import CONFIG from '../config'
import { User } from '../graphql/models/User'
import { LoginUserInput } from '../graphql/inputs/LoginUserInput'
// eslint-disable-next-line no-unused-vars
// import regeneratorRuntime from 'regenerator-runtime'

// control email-text sended with email verification code
const EMAIL_TYPE = {
  DEFAULT: 2, // if user has registered directly
  ADMIN: 5, // if user was registered by an admin
}

const apiGet = async (url: string) => {
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

const apiPost = async (url: string, payload: any): Promise<any> => {
  try {
    const result = await axios.post(url, payload)
    if (result.status !== 200) {
      throw new Error('HTTP Status Error ' + result.status)
    }
    if (result.data.state === 'warning') {
      return { success: true, result: result.data.errors }
    }
    if (result.data.state !== 'success') {
      throw new Error(result.data.msg)
    }
    return { success: true, result }
  } catch (error) {
    return { success: false, result: error }
  }
}

interface NetworkInfosResult {
  state: string
  msg?: string
  errors: string[]
  data: {
    groups?: string[]
  }
}

interface LoginResult {
  state: string
  msg?: string
  details?: number
  info?: string
  user?: User
  // eslint-disable-next-line camelcase
  session_id?: number
}

const loginAPI = {
  login: async (login: LoginUserInput): Promise<LoginResult> => {
    return (await apiPost(CONFIG.LOGIN_API_URL + 'unsecureLogin', login)).result.data
  },
  logout: async (sessionId: number): Promise<any> => {
    const payload: any = { session_id: sessionId }
    return apiPost(CONFIG.LOGIN_API_URL + 'logout', payload)
  },
  create: async (
    email: string,
    firstName: string,
    lastName: string,
    password: string,
  ): Promise<any> => {
    const payload: any = {
      email,
      first_name: firstName,
      last_name: lastName,
      password,
      emailType: EMAIL_TYPE.DEFAULT,
      login_after_register: true,
    }
    return apiPost(CONFIG.LOGIN_API_URL + 'createUser', payload)
  },
  sendEmail: async (
    email: string,
    email_text = 7,
    email_verification_code_type = 'resetPassword',
  ): Promise<any> => {
    const payload: any = {
      email,
      email_text,
      email_verification_code_type,
    }
    return apiPost(CONFIG.LOGIN_API_URL + 'sendEmail', payload)
  },
  loginViaEmailVerificationCode: async (optin: number): Promise<any> => {
    return apiGet(
      CONFIG.LOGIN_API_URL + 'loginViaEmailVerificationCode?emailVerificationCode=' + optin,
    )
  },
  getUserInfos: async (sessionId: number, email: string): Promise<any> => {
    const payload: any = {
      session_id: sessionId,
      email: email,
      ask: ['user.first_name', 'user.last_name'],
    }
    return apiPost(CONFIG.LOGIN_API_URL + 'getUserInfos', payload)
  },
  updateUserInfos: async (sessionId: number, email: string, data: any): Promise<any> => {
    const payload: any = {
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
  changePassword: async (sessionId: number, email: string, password: string): Promise<any> => {
    const payload: any = {
      session_id: sessionId,
      email,
      password,
    }
    return apiPost(CONFIG.LOGIN_API_URL + 'resetPassword', payload)
  },
  changePasswordProfile: async (
    sessionId: number,
    email: string,
    password: string,
    passwordNew: string,
  ): Promise<any> => {
    const payload: any = {
      session_id: sessionId,
      email,
      update: {
        'User.password_old': password,
        'User.password': passwordNew,
      },
    }
    return apiPost(CONFIG.LOGIN_API_URL + 'updateUserInfos', payload)
  },
  changeUsernameProfile: async (
    sessionId: number,
    email: string,
    username: string,
  ): Promise<any> => {
    const payload: any = {
      session_id: sessionId,
      email,
      update: {
        'User.username': username,
      },
    }
    return apiPost(CONFIG.LOGIN_API_URL + 'updateUserInfos', payload)
  },
  updateLanguage: async (sessionId: number, email: string, language: string): Promise<any> => {
    const payload: any = {
      session_id: sessionId,
      email,
      update: {
        'User.language': language,
      },
    }
    return apiPost(CONFIG.LOGIN_API_URL + 'updateUserInfos', payload)
  },
  checkUsername: async (username: string, groupId = 1): Promise<any> => {
    return apiGet(CONFIG.LOGIN_API_URL + `checkUsername?username=${username}&group_id=${groupId}`)
  },
  getNetworkInfos: async (ask: string[]): Promise<NetworkInfosResult> => {
    return (await apiPost(CONFIG.LOGIN_API_URL + `networkInfos`, { ask: ask })).result.data
  },
}

export { loginAPI, NetworkInfosResult, LoginResult }
