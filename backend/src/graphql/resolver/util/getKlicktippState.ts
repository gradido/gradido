import { KlickTipp } from '@model/KlickTipp'

import { getKlickTippUser } from '@/apis/KlicktippController'
import { klickTippLogger as logger } from '@/server/logger'

export const getKlicktippState = async (email: string): Promise<KlickTipp> => {
  try {
    const klickTippUser = await getKlickTippUser(email)
    if (klickTippUser) {
      return new KlickTipp(klickTippUser.status === 'Subscribed')
    }
  } catch (err) {
    logger.error('There is no klicktipp user for email', email, err)
  }
  return new KlickTipp(false)
}
