/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { KlicktippConnector } from './klicktippConnector'
import CONFIG from '../config'

const klicktippConnector = new KlicktippConnector()

export const signin = async (email: string, language: string): Promise<boolean> => {
  const fields = {}
  const apiKey = language === 'de' ? CONFIG.KLICKTIPP_APIKEY_DE : CONFIG.KLICKTIPP_APIKEY_EN
  const result = await klicktippConnector.signin(apiKey, email, fields)
  return result
}

export const signout = async (email: string, language: string): Promise<boolean> => {
  const apiKey = language === 'de' ? CONFIG.KLICKTIPP_APIKEY_DE : CONFIG.KLICKTIPP_APIKEY_EN
  const result = await klicktippConnector.signoff(apiKey, email)
  return result
}

export const userTags = async (email: string): Promise<any> => {
  const isLogin = await loginKlicktippUser()
  if (isLogin) {
    const subscriberId = await klicktippConnector.subscriberSearch(email)
    const result = await klicktippConnector.subscriberGet(subscriberId)
    await logoutKlicktippUser()
    return result
  }
}

export const loginKlicktippUser = async (): Promise<boolean> => {
  return await klicktippConnector.login(CONFIG.KLICKTIPP_USER, CONFIG.KLICKTIPP_PASSWORD)
}

export const logoutKlicktippUser = async (): Promise<boolean> => {
  return await klicktippConnector.logout()
}

export const untagUser = async (email: string, tagid: string): Promise<boolean> => {
  const isLogin = await loginKlicktippUser()
  if (isLogin) {
    return await klicktippConnector.untag(email, tagid)
  }
  return false
}

export const tagUser = async (email: string, tagids: string): Promise<boolean> => {
  const isLogin = await loginKlicktippUser()
  if (isLogin) {
    return await klicktippConnector.tag(email, tagids)
  }
  return false
}
