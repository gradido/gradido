import { federationLogger as logger } from '@/server/logger'
import { NonEmptyArray } from 'type-graphql'
// config
import { CONFIG } from '../../config'
import { getApiResolvers as getApiResolvers_1_0 } from './1_0/schema'
import { getApiResolvers as getApiResolvers_1_1 } from './1_1/schema'

export const getApiResolvers = (): NonEmptyArray<Function> => {
  logger.info(`getApiResolvers...${CONFIG.FEDERATION_API}`)

  if (CONFIG.FEDERATION_API === '1_0') {
    return getApiResolvers_1_0()
  }

  if (CONFIG.FEDERATION_API === '1_1') {
    return getApiResolvers_1_1()
  }

  throw new Error(`Unknown API version: ${CONFIG.FEDERATION_API}`)
}
