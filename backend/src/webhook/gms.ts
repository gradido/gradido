import { dbIsHomeCommunityUserExistByUuid } from 'database'
import { Elysia } from 'elysia'
import { getLogger } from 'log4js'
import * as v from 'valibot'
import { verifyGmsHandshakeJWTToken } from '@/apis/gms/GmsClient'
import { CONFIG } from '@/config'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.webhook.gms`)

export const gmsWebhookRoutes = new Elysia().get(
  '/hook/gms/' + CONFIG.GMS_WEBHOOK_SECRET,
  async ({ query, status }) => {
    logger.info('GMS Hook received')
    const { token } = query

    if (!token) {
      logger.debug('gmsWebhook: missing token', query)
      return status(400, { message: 'false' })
    }
    const gradidoID = verifyGmsHandshakeJWTToken(token)
    logger.debug('gmsWebhook: decoded token, gradidoID=', gradidoID)
    if (!gradidoID) {
      logger.debug('gmsWebhook: invalid token', token)
      logger.warn(`gms verify call failed`)
      return status(400, { message: 'false' })
    }

    if (!(await dbIsHomeCommunityUserExistByUuid(gradidoID))) {
      logger.error('gmsWebhook: missing user', gradidoID)
      return status(400, { message: 'false' })
    }
    logger.debug(`gmsWebhook: authenticate user=${gradidoID}`)
    logger.info('gmsWebhook: authentication successful')
    return gradidoID
  },
  {
    // a hook without a token is answered by the handler, in the words the GMS knows
    query: v.object({ token: v.optional(v.string()) }),
    response: { 200: v.string(), 400: v.object({ message: v.string() }) },
  },
)
