/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import CONFIG from '@/config'

// eslint-disable-next-line import/no-relative-parent-imports
import KlicktippConnector from 'klicktipp-api'

const klicktippConnector = new KlicktippConnector()

export const klicktippSignIn = async (
  email: string,
  language: string,
  firstName?: string,
  lastName?: string,
): Promise<boolean> => {
  if (!CONFIG.KLICKTIPP) return true
  const fields = {
    fieldFirstName: firstName,
    fieldLastName: lastName,
  }
  const apiKey = language === 'de' ? CONFIG.KLICKTIPP_APIKEY_DE : CONFIG.KLICKTIPP_APIKEY_EN
  const result = await klicktippConnector.signin(apiKey, email, fields)
  return result
}

export const signout = async (email: string, language: string): Promise<boolean> => {
  if (!CONFIG.KLICKTIPP) return true
  const apiKey = language === 'de' ? CONFIG.KLICKTIPP_APIKEY_DE : CONFIG.KLICKTIPP_APIKEY_EN
  const result = await klicktippConnector.signoff(apiKey, email)
  return result
}

export const unsubscribe = async (email: string): Promise<boolean> => {
  if (!CONFIG.KLICKTIPP) return true
  const isLogin = await loginKlicktippUser()
  if (isLogin) {
    return await klicktippConnector.unsubscribe(email)
  }
  throw new Error(`Could not unsubscribe ${email}`)
}

export const getKlickTippUser = async (email: string): Promise<any> => {
  if (!CONFIG.KLICKTIPP) return true
  const isLogin = await loginKlicktippUser()
  if (isLogin) {
    const subscriberId = await klicktippConnector.subscriberSearch(email)
    const result = await klicktippConnector.subscriberGet(subscriberId)
    return result
  }
  return false
}

export const loginKlicktippUser = async (): Promise<boolean> => {
  if (!CONFIG.KLICKTIPP) return true
  return await klicktippConnector.login(CONFIG.KLICKTIPP_USER, CONFIG.KLICKTIPP_PASSWORD)
}

export const logoutKlicktippUser = async (): Promise<boolean> => {
  if (!CONFIG.KLICKTIPP) return true
  return await klicktippConnector.logout()
}

export const untagUser = async (email: string, tagId: string): Promise<boolean> => {
  if (!CONFIG.KLICKTIPP) return true
  const isLogin = await loginKlicktippUser()
  if (isLogin) {
    return await klicktippConnector.untag(email, tagId)
  }
  return false
}

export const tagUser = async (email: string, tagIds: string): Promise<boolean> => {
  if (!CONFIG.KLICKTIPP) return true
  const isLogin = await loginKlicktippUser()
  if (isLogin) {
    return await klicktippConnector.tag(email, tagIds)
  }
  return false
}

export const getKlicktippTagMap = async () => {
  if (!CONFIG.KLICKTIPP) return true
  const isLogin = await loginKlicktippUser()
  if (isLogin) {
    return await klicktippConnector.tagIndex()
  }
  return ''
}

export const addFieldsToSubscriber = async (
  email: string,
  fields: any = {},
  newemail = '',
  newsmsnumber = '',
) => {
  return callKlickTippAPI(
    async ({ email, fields, newemail, newsmsnumber }) => {
      const isLogin = await loginKlicktippUser()
      if (isLogin) {
        const subscriberId = await klicktippConnector.subscriberSearch(email)
        return klicktippConnector.subscriberUpdate(subscriberId, fields, newemail, newsmsnumber)
      }
      throw new LogError(`Could not add fields (${fields}) to subscriber ${email}`)
    },
    { email, fields, newemail, newsmsnumber },
  )
}
