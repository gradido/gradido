import { KlickTipp } from '@model/KlickTipp'
import { getLogger } from 'log4js'
import { getKlickTippUser } from '@/apis/KlicktippController'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.graphql.resolver.util.getKlicktippState`)

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
