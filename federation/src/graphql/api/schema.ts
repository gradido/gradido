import path from 'path'
// config
import CONFIG from '../../config'
import { federationLogger as logger } from '@/server/logger'

export const getApiResolvers = () => {
  logger.info(`getApiResolvers...${CONFIG.FEDERATION_API}`)
  return path.join(__dirname, `./${CONFIG.FEDERATION_API}/resolver/*Resolver.{ts,js}`)
}
