import KlicktippConnector from 'klicktipp-api'
import { getLogger } from 'log4js'
import { CONFIG } from '@/config'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'

const klicktippConnector = new KlicktippConnector()
const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.apis.KlicktippController`)

export const subscribe = async (
  email: string,
  language: string,
  firstName?: string,
  lastName?: string,
): Promise<boolean> => {
  if (!CONFIG.KLICKTIPP) {
    return true
  }
  const fields = {
    fieldFirstName: firstName,
    fieldLastName: lastName,
  }
  const apiKey = language === 'de' ? CONFIG.KLICKTIPP_APIKEY_DE : CONFIG.KLICKTIPP_APIKEY_EN
  const result = await klicktippConnector.signin(apiKey, email, fields)
  return result
}

export const unsubscribe = async (email: string): Promise<boolean> => {
  if (!CONFIG.KLICKTIPP) {
    return true
  }
  const isLogin = await loginKlicktippUser()
  if (isLogin) {
    return await klicktippConnector.unsubscribe(email)
  }
  throw new Error(`Could not unsubscribe ${email}`)
}

export const getKlickTippUser = async (email: string): Promise<any> => {
  if (!CONFIG.KLICKTIPP) {
    return true
  }
  const isLogin = await loginKlicktippUser()
  if (isLogin) {
    try {
      return klicktippConnector.subscriberGet(await klicktippConnector.subscriberSearch(email))
    } catch (_e) {
      logger.error('Could not find subscriber', email)
      return false
    }
  }
  return false
}

export const loginKlicktippUser = async (): Promise<boolean> => {
  if (!CONFIG.KLICKTIPP) {
    return true
  }
  return await klicktippConnector.login(CONFIG.KLICKTIPP_USER, CONFIG.KLICKTIPP_PASSWORD)
}

export const addFieldsToSubscriber = async (
  email: string,
  fields: any = {},
  newemail = '',
  newsmsnumber = '',
) => {
  if (!CONFIG.KLICKTIPP) {
    return true
  }
  const isLogin = await loginKlicktippUser()
  if (isLogin) {
    try {
      logger.info('Updating of subscriber', email)
      return klicktippConnector.subscriberUpdate(
        await klicktippConnector.subscriberSearch(email),
        fields,
        newemail,
        newsmsnumber,
      )
    } catch (e) {
      logger.error('Could not update subscriber', email, fields, e)
      return false
    }
  }
  return false
}
