/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { User as DbUser } from '@entity/User'

import { decode } from '@/auth/JWT'
import { backendLogger as logger } from '@/server/logger'

export const gmsWebhook = async (req: any, res: any): Promise<void> => {
  logger.info('GMS Hook received', req.body)
  const { token } = req.body

  if (!token) {
    logger.warn('gmsWebhook: missing token')
    res.status(400).json({ message: 'false' })
    return
  }
  const payload = await decode(token)
  if (payload) {
    const user = await DbUser.findOne({ where: { gradidoID: payload.gradidoID } })
    if (!user) {
      logger.warn('gmsWebhook: missing user')
      res.status(400).json({ message: 'false' })
      return
    }
    logger.info('gmsWebhook: authenticate user=', user)
  }
  logger.info('gmsWebhook: authentication successful')
  res.status(200).json({ message: 'true' })
}
