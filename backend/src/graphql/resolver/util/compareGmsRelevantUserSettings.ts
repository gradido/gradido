import { UpdateUserInfosArgs } from '@/graphql/arg/UpdateUserInfosArgs'
import { backendLogger as logger } from '@/server/logger'

export function compareGmsRelevantUserSettings(input: UpdateUserInfosArgs): boolean {
  logger.debug('compareGmsRelevantUserSettings:', input)
  if (input.alias) {
    return true
  }
  if (input.firstName || input.lastName) {
    return true
  }
  if (input.gmsAllowed) {
    return true
  }
  if (input.gmsPublishLocation) {
    return true
  }
  if (input.gmsPublishName) {
    return true
  }
  if (input.language) {
    return true
  }
  if (input.gmsLocation) {
    return true
  }
  return false
}
