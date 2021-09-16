/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { KlicktippConnector } from './klicktippConnector'
import CONFIG from '../config'

const klicktippConnector = new KlicktippConnector()

export const signin = async (
  email: string,
  language: string,
  firstName?: string,
  lastName?: string,
): Promise<boolean> => {
  const fields = {
    fieldFirstName: firstName,
    fieldLastName: lastName,
  }
  const apiKey = language === 'de' ? CONFIG.KLICKTIPP_APIKEY_DE : CONFIG.KLICKTIPP_APIKEY_EN
  const result = await klicktippConnector.signin(apiKey, email, fields)
  return result
}

export const signout = async (email: string, language: string): Promise<boolean> => {
  const apiKey = language === 'de' ? CONFIG.KLICKTIPP_APIKEY_DE : CONFIG.KLICKTIPP_APIKEY_EN
  const result = await klicktippConnector.signoff(apiKey, email)
  return result
}

export const unsubscribe = async (email: string): Promise<boolean> => {
  const isLogin = await loginKlicktippUser()
  if (isLogin) {
    return await klicktippConnector.unsubscribe(email)
  }
  throw new Error(`Could not unsubscribe ${email}`)
}

export const getKlickTippUser = async (email: string): Promise<any> => {
  const isLogin = await loginKlicktippUser()
  if (isLogin) {
    const subscriberId = await klicktippConnector.subscriberSearch(email)
    const result = await klicktippConnector.subscriberGet(subscriberId)
    return result
  }
  throw new Error()
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
  throw new Error()
}

export const tagUser = async (email: string, tagids: string): Promise<boolean> => {
  const isLogin = await loginKlicktippUser()
  if (isLogin) {
    return await klicktippConnector.tag(email, tagids)
  }
  throw new Error()
}

export const getKlicktippTagMap = async () => {
  const isLogin = await loginKlicktippUser()
  if (isLogin) {
    return await klicktippConnector.tagIndex()
  }
  throw new Error()
}
