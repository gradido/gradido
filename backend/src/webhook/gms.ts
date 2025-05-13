import { User as DbUser } from '@entity/User'

import { decode } from '@/auth/JWT'
import { gmsLogger as logger } from '@/server/logger'

export const gmsWebhook = async (req: any, res: any): Promise<void> => {
  logger.info('GMS Hook received')
  const { token } = req.query

  if (!token) {
    logger.debug('gmsWebhook: missing token', req.query)
    res.status(400).json({ message: 'false' })
    return
  }
  const payload = await decode(token)
  logger.debug('gmsWebhook: decoded token=', payload)
  if (!payload) {
    logger.debug('gmsWebhook: invalid token', token)
    res.status(400).json({ message: 'false' })
    return
  }
  const user = await DbUser.findOne({ where: { gradidoID: payload.gradidoID } })
  if (!user) {
    logger.error('gmsWebhook: missing user', payload.gradidoID)
    res.status(400).json({ message: 'false' })
    return
  }
  logger.debug(
    'gmsWebhook: authenticate user=',
    user.gradidoID,
    user.firstName.slice(0, 3),
    user.lastName.slice(0, 3),
  )
  logger.info('gmsWebhook: authentication successful')
  res.status(200).json({ userUuid: user.gradidoID })
}
