import { Point } from '@dbTools/typeorm'
import { User as DbUser } from '@entity/User'

import { UpdateUserInfosArgs } from '@/graphql/arg/UpdateUserInfosArgs'
import { LogError } from '@/server/LogError'
import { backendLogger as logger } from '@/server/logger'

import { Point2Location } from './Location2Point'

export function compareGmsRelevantUserSettings(
  orgUser: DbUser,
  updateUserInfosArgs: UpdateUserInfosArgs,
): boolean {
  if (!orgUser) {
    throw new LogError('comparison without any user is impossible')
  }
  logger.debug('compareGmsRelevantUserSettings:', orgUser, updateUserInfosArgs)
  if (updateUserInfosArgs.alias && orgUser.alias !== updateUserInfosArgs.alias) {
    return true
  }
  if (
    (updateUserInfosArgs.firstName && orgUser.firstName !== updateUserInfosArgs.firstName) ||
    (updateUserInfosArgs.lastName && orgUser.lastName !== updateUserInfosArgs.lastName)
  ) {
    return true
  }
  if (updateUserInfosArgs.gmsAllowed && orgUser.gmsAllowed !== updateUserInfosArgs.gmsAllowed) {
    return true
  }
  if (
    updateUserInfosArgs.gmsPublishLocation &&
    orgUser.gmsPublishLocation !== updateUserInfosArgs.gmsPublishLocation
  ) {
    return true
  }
  if (
    updateUserInfosArgs.gmsPublishName &&
    orgUser.gmsPublishName !== updateUserInfosArgs.gmsPublishName
  ) {
    return true
  }
  if (updateUserInfosArgs.language && orgUser.language !== updateUserInfosArgs.language) {
    return true
  }
  if (
    updateUserInfosArgs.gmsLocation &&
    orgUser.location === null &&
    updateUserInfosArgs.gmsLocation !== null
  ) {
    return true
  }
  if (
    updateUserInfosArgs.gmsLocation &&
    orgUser.location !== null &&
    updateUserInfosArgs.gmsLocation === null
  ) {
    return true
  }
  if (
    updateUserInfosArgs.gmsLocation &&
    orgUser.location !== null &&
    updateUserInfosArgs.gmsLocation !== null
  ) {
    const orgLocation = Point2Location(orgUser.location as Point)
    const changedLocation = updateUserInfosArgs.gmsLocation
    if (
      orgLocation.latitude !== changedLocation.latitude ||
      orgLocation.longitude !== changedLocation.longitude
    ) {
      return true
    }
  }
  return false
}
