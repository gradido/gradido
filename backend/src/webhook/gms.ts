import { User as DbUser } from 'database'
import { getLogger } from 'log4js'
import { decode } from '@/auth/JWT'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.webhook.gms`)

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
