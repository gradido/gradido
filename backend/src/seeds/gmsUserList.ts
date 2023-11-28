/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */

import { entities } from '@entity/index'
import { User as DbUser } from '@entity/User'
import { createTestClient } from 'apollo-server-testing'

import { communityList, createGmsUser, userList } from '@/apis/gms/GmsClient'
import { GmsUser } from '@/apis/gms/model/GmsUser'
import { CONFIG } from '@/config'
import { getHomeCommunity } from '@/graphql/resolver/util/communities'
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
  const seedClient = createTestClient(server.apollo)
  const { con } = server

  // test GMS-Api Client
  try {
    const gmsComArray = await communityList()
    logger.debug('GMS-Community-List:', gmsComArray)
    const gmsUserArray = await userList()
    logger.debug('GMS-Community-User-List:', gmsUserArray)
  } catch (err) {
    logger.error('Error in GMS-API:', err)
  }
  await con.close()
}

void run()
