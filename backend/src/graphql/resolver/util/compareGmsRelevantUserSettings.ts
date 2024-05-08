import { Point } from '@dbTools/typeorm'
import { User as DbUser } from '@entity/User'

import { UpdateUserInfosArgs } from '@/graphql/arg/UpdateUserInfosArgs'
import { GmsPublishNameType } from '@/graphql/enum/GmsPublishNameType'
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
  // nach GMS updaten, wenn alias gesetzt wird oder ist und PublishLevel die alias-Übermittlung erlaubt
  if (
    updateUserInfosArgs.alias &&
    orgUser.alias !== updateUserInfosArgs.alias &&
    ((updateUserInfosArgs.gmsPublishName &&
      updateUserInfosArgs.gmsPublishName.valueOf ===
        GmsPublishNameType.GMS_PUBLISH_NAME_ALIAS_OR_INITALS.valueOf) ||
      (!updateUserInfosArgs.gmsPublishName &&
        orgUser.gmsPublishName &&
        orgUser.gmsPublishName.valueOf ===
          GmsPublishNameType.GMS_PUBLISH_NAME_ALIAS_OR_INITALS.valueOf))
  ) {
    logger.debug('changed GmsPublishNameType')
    return true
  }
  if (
    (updateUserInfosArgs.firstName && orgUser.firstName !== updateUserInfosArgs.firstName) ||
    (updateUserInfosArgs.lastName && orgUser.lastName !== updateUserInfosArgs.lastName)
  ) {
    logger.debug('changed User-Name')
    return true
  }
  if (
    updateUserInfosArgs.gmsAllowed !== undefined &&
    updateUserInfosArgs.gmsAllowed &&
    orgUser.gmsAllowed !== updateUserInfosArgs.gmsAllowed
  ) {
    logger.debug('changed gmsAllowed')
    return true
  }
  if (
    updateUserInfosArgs.gmsPublishLocation &&
    orgUser.gmsPublishLocation !== updateUserInfosArgs.gmsPublishLocation
  ) {
    logger.debug('changed gmsPublishLocation')
    return true
  }
  if (
    updateUserInfosArgs.gmsPublishName &&
    orgUser.gmsPublishName !== updateUserInfosArgs.gmsPublishName
  ) {
    logger.debug('changed gmsPublishName')
    return true
  }
  if (updateUserInfosArgs.language && orgUser.language !== updateUserInfosArgs.language) {
    logger.debug('changed language')
    return true
  }
  if (
    updateUserInfosArgs.gmsLocation &&
    orgUser.location === null &&
    updateUserInfosArgs.gmsLocation !== null
  ) {
    logger.debug('changed gmsLocation1')
    return true
  }
  if (
    updateUserInfosArgs.gmsLocation &&
    orgUser.location !== null &&
    updateUserInfosArgs.gmsLocation === null
  ) {
    logger.debug('changed gmsLocation2')
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
      logger.debug('changed location')
      return true
    }
  }
  logger.debug('nothing changed')
  return false
}
