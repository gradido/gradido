/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
import CONFIG from '@/config'
import LogError from '@/server/LogError'

// eslint-disable-next-line import/no-relative-parent-imports
import KlicktippConnector from 'klicktipp-api'

const klicktippConnector = new KlicktippConnector()

const callKlickTippAPI = (callback: (arg0: any) => any, args: any) => {
  if (!CONFIG.KLICKTIPP) {
    return true
  }
  return callback(args)
}

export const klicktippSignIn = (
  email: string,
  language: string,
  firstName?: string,
  lastName?: string,
): Promise<boolean> => {
  return callKlickTippAPI(
    ({ fieldFirstName, fieldLastName, language, email }) => {
      const fields = {
        fieldFirstName,
        fieldLastName,
      }
      const apiKey = language === 'de' ? CONFIG.KLICKTIPP_APIKEY_DE : CONFIG.KLICKTIPP_APIKEY_EN
      return klicktippConnector.signin(apiKey, email, fields)
    },
    {
      fieldFirstName: firstName,
      fieldLastName: lastName,
      language,
      email,
    },
  )
}

export const signout = (email: string, language: string): Promise<boolean> => {
  return callKlickTippAPI(
    async ({ language, email }) => {
      const apiKey = language === 'de' ? CONFIG.KLICKTIPP_APIKEY_DE : CONFIG.KLICKTIPP_APIKEY_EN
      const result = await klicktippConnector.signoff(apiKey, email)
      return result
    },
    {
      email,
      language,
    },
  )
}

export const unsubscribe = (email: string): Promise<boolean> => {
  return callKlickTippAPI(
    async ({ email }) => {
      const isLogin = await loginKlicktippUser()
      if (isLogin) {
        return klicktippConnector.unsubscribe(email)
      }
      throw new LogError(`Could not unsubscribe ${email}`)
    },
    {
      email,
    },
  )
}

export const getKlickTippUser = (email: string): Promise<any> => {
  return callKlickTippAPI(
    async ({ email }) => {
      const isLogin = await loginKlicktippUser()
      if (isLogin) {
        const subscriberId = await klicktippConnector.subscriberSearch(email)
        return klicktippConnector.subscriberGet(subscriberId)
      }
      throw new LogError(`Could not get subscriber ${email}`)
    },
    {
      email,
    },
  )
}

export const loginKlicktippUser = (): Promise<boolean> => {
  return callKlickTippAPI(() => {
    return klicktippConnector.login(CONFIG.KLICKTIPP_USER, CONFIG.KLICKTIPP_PASSWORD)
  }, {})
}

export const logoutKlicktippUser = (): Promise<boolean> => {
  return callKlickTippAPI(() => {
    return klicktippConnector.logout()
  }, {})
}

export const untagUser = (email: string, tagId: string): Promise<boolean> => {
  return callKlickTippAPI(
    async ({ email, tagId }) => {
      const isLogin = await loginKlicktippUser()
      if (isLogin) {
        return await klicktippConnector.untag(email, tagId)
      }
      throw new LogError(`Could not untag ${email}`)
    },
    { email, tagId },
  )
}

export const tagUser = (email: string, tagIds: string): Promise<boolean> => {
  return callKlickTippAPI(
    async ({ email, tagIds }) => {
      const isLogin = await loginKlicktippUser()
      if (isLogin) {
        return klicktippConnector.tag(email, tagIds)
      }
      throw new LogError(`Could not tag ${email}`)
    },
    { email, tagIds },
  )
}

export const getKlicktippTagMap = (): Promise<any> => {
  return callKlickTippAPI(async () => {
    const isLogin = await loginKlicktippUser()
    if (isLogin) {
      return klicktippConnector.tagIndex()
    }
    throw new LogError(`Could not get tagIndexes`)
  }, {})
}

export const addFieldsToSubscriber = async (
  email: string,
  fields: any = {},
  newemail = '',
  newsmsnumber = '',
) => {
  const isLogin = await loginKlicktippUser()
  if (isLogin) {
    const subscriberId = await klicktippConnector.subscriberSearch(email)
    return await klicktippConnector.subscriberUpdate(subscriberId, fields, newemail, newsmsnumber)
  }
}
