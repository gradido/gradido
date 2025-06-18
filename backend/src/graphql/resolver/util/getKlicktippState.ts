import { KlickTipp } from '@model/KlickTipp'

import { getKlickTippUser } from '@/apis/KlicktippController'
import { LOG4JS_GRAPHQL_RESOLVER_UTIL_CATEGORY_NAME } from '@/graphql/resolver/util'
import { getLogger } from 'log4js'

const logger = getLogger(`${LOG4JS_GRAPHQL_RESOLVER_UTIL_CATEGORY_NAME}.getKlicktippState`)

export const getKlicktippState = async (email: string): Promise<KlickTipp> => {
  try {
    const klickTippUser = await getKlickTippUser(email)
    if (klickTippUser) {
      return new KlickTipp(klickTippUser.status === 'Subscribed')
    }
  } catch (err) {
    logger.error('There is no klicktipp user for email', email.substring(0, 3), '...', err)
  }
  return new KlickTipp(false)
}
