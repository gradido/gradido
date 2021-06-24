// ATTENTION: DO NOT PUT ANY SECRETS IN HERE (or the .env)

import dotenv from 'dotenv'
dotenv.config()

const server = {
  LOGIN_API_URL: process.env.LOGIN_API_URL || 'http://localhost/login_api/',
  COMMUNITY_API_URL: process.env.COMMUNITY_API_URL || 'http://localhost/api/',
}

const CONFIG = { ...server }

export default CONFIG
