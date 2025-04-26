import path from 'node:path'
import { federationLogger as logger } from '@/server/logger'
// config
import { CONFIG } from '../../config'

export const getApiResolvers = (): string => {
  logger.info(`getApiResolvers...${CONFIG.FEDERATION_API}`)
  return path.join(__dirname, `./${CONFIG.FEDERATION_API}/resolver/*Resolver.{ts,js}`)
}
