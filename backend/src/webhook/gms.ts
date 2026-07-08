import { User as DbUser } from 'database'
import { getLogger } from 'log4js'
import { verifyGmsHandshakeJWTToken } from '@/apis/gms/GmsClient'
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
  const gradidoID = await verifyGmsHandshakeJWTToken(token)
  logger.debug('gmsWebhook: decoded token, gradidoID=', gradidoID)
  if (!gradidoID) {
    logger.debug('gmsWebhook: invalid token', token)
    res.status(400).json({ message: 'false' })
    return
  }
  const user = await DbUser.findOne({ where: { gradidoID } })
  if (!user) {
    logger.error('gmsWebhook: missing user', gradidoID)
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
  res.status(200).send(user.gradidoID)
}
