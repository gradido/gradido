/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */

import { entities } from '@entity/index'
import { User as DbUser } from '@entity/User'
// import { createTestClient } from 'apollo-server-testing'

// import { createGmsUser } from '@/apis/gms/GmsClient'
// import { GmsUser } from '@/apis/gms/model/GmsUser'
import { CONFIG } from '@/config'
import { getHomeCommunity } from '@/graphql/resolver/util/communities'
import { sendUserToGms } from '@/graphql/resolver/util/sendUserToGms'
import { createServer } from '@/server/createServer'
import { LogError } from '@/server/LogError'
import { backendLogger as logger } from '@/server/logger'

CONFIG.EMAIL = false

const context = {
  token: '',
  setHeaders: {
    push: (value: { key: string; value: string }): void => {
      context.token = value.value
    },
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    forEach: (): void => {},
  },
  clientTimezoneOffset: 0,
}

export const cleanDB = async () => {
  // this only works as long we do not have foreign key constraints
  for (const entity of entities) {
    await resetEntity(entity)
  }
}

const resetEntity = async (entity: any) => {
  const items = await entity.find({ withDeleted: true })
  if (items.length > 0) {
    const ids = items.map((e: any) => e.id)
    await entity.delete(ids)
  }
}

const run = async () => {
  const server = await createServer(context)
  // const seedClient = createTestClient(server.apollo)
  const { con } = server

  const homeCom = await getHomeCommunity()
  if (homeCom.gmsApiKey === null) {
    throw new LogError('HomeCommunity needs GMS-ApiKey to publish user data to GMS.')
  }
  // read the ids of all local users, which are still not gms registered
  const userIds = await DbUser.createQueryBuilder()
    .select('id')
    .where({ foreign: false })
    // .andWhere('deleted_at is null')
    // .andWhere({ gmsRegistered: false })
    .getRawMany()
  logger.debug('userIds:', userIds)

  for (const idStr of userIds) {
    logger.debug('Id:', idStr.id)
    const user = await DbUser.findOne({
      where: { id: idStr.id },
      relations: ['emailContact'],
    })
    if (user) {
      logger.debug('found local User:', user)
      if (user.gmsAllowed) {
        await sendUserToGms(user, homeCom)
        /*
        const gmsUser = new GmsUser(user)
        try {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          if (await createGmsUser(homeCom.gmsApiKey, gmsUser)) {
            logger.debug('GMS user published successfully:', gmsUser)
            user.gmsRegistered = true
            user.gmsRegisteredAt = new Date()
            await DbUser.save(user)
            logger.debug('mark user as gms published:', user)
          }
        } catch (err) {
          logger.warn('publishing user fails with ', err)
        }
        */
      } else {
        logger.debug('GMS-Publishing not allowed by user settings:', user)
      }
    }
  }
  logger.info('##gms## publishing all local users successful...')

  await con.close()
}

void run()
