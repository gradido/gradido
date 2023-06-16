/* eslint-disable @typescript-eslint/no-unsafe-return */
import { KlickTipp } from '@model/KlickTipp'

import { getKlickTippUser } from '@/apis/KlicktippController'
import { klickTippLogger as logger } from '@/server/logger'

export const getKlicktippState = async (email: string): Promise<KlickTipp> => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const klickTippUser = await getKlickTippUser(email)
    if (klickTippUser) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      return new KlickTipp(klickTippUser.status === 'Subscribed')
    }
  } catch (err) {
    logger.error('There is no klicktipp user for email', email, err)
  }
  return new KlickTipp(false)
}
