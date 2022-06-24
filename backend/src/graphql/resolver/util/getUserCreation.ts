import { backendLogger as logger } from '@/server/logger'
import Decimal from 'decimal.js-light'
import { getUserCreations, FULL_CREATION_AVAILABLE } from '../AdminResolver'

export const getUserCreation = async (id: number, includePending = true): Promise<Decimal[]> => {
  logger.trace('getUserCreation', id, includePending)
  const creations = await getUserCreations([id], includePending)
  return creations[0] ? creations[0].creations : FULL_CREATION_AVAILABLE
}
