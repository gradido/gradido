import { NonEmptyArray } from 'type-graphql'

import { LogError } from '@/server/LogError'
import { federationLogger as logger } from '@/server/logger'

import { getApiResolver as apiResolver10 } from './1_0/apiResolver'
import { getApiResolver as apiResolver11 } from './1_1/apiResolver'

// eslint-disable-next-line @typescript-eslint/ban-types
export const getApiResolvers = (apiVersion: string): NonEmptyArray<Function> => {
  logger.info(`getApiResolvers...${apiVersion}`)
  if (apiVersion === '1_0') {
    return apiResolver10()
  } else if (apiVersion === '1_1') {
    return apiResolver11()
  }
  throw new LogError(`${apiVersion} not implemented yet`)
}
