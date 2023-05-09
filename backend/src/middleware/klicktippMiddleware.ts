/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { MiddlewareFn } from 'type-graphql'

import { KlickTipp } from '@model/KlickTipp'

import { getKlickTippUser } from '@/apis/KlicktippController'
import { klickTippLogger as logger } from '@/server/logger'

export const klicktippNewsletterStateMiddleware: MiddlewareFn = async (
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  { root, args, context, info },
  next,
) => {
  // eslint-disable-next-line n/callback-return
  const result = await next()
  let klickTipp = new KlickTipp({ status: 'Unsubscribed' })
  try {
    const klickTippUser = await getKlickTippUser(result.email)
    if (klickTippUser) {
      klickTipp = new KlickTipp(klickTippUser)
    }
  } catch (err) {
    logger.error(`There is no user for (email='${result.email}') ${err}`)
  }
  result.klickTipp = klickTipp
  return result
}
