import { GmsUser } from '@/apis/gms/model/GmsUser'
import { UpdateUserInfosArgs } from '@/graphql/arg/UpdateUserInfosArgs'
import { backendLogger as logger } from '@/server/logger'

export function compareGmsRelevantUserSettings(
  gmsUser: GmsUser,
  input: UpdateUserInfosArgs,
): boolean {
  logger.debug('compareGmsRelevantUserSettings:', input)

  if (input.alias && gmsUser.alias) {
    return true
  }
  if (input.firstName && gmsUser.firstName) {
    return true
  }
  if (input.lastName && gmsUser.lastName) {
    return true
  }
  if (input.gmsAllowed !== undefined) {
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
