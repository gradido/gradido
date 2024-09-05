import { Point } from '@dbTools/typeorm'
import { User as DbUser } from '@entity/User'

import { UpdateUserInfosArgs } from '@/graphql/arg/UpdateUserInfosArgs'
import { PublishNameType } from '@/graphql/enum/PublishNameType'
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
    ((updateUserInfosArgs.gmsPublishName != null &&
      updateUserInfosArgs.gmsPublishName.valueOf ===
        PublishNameType.PUBLISH_NAME_ALIAS_OR_INITALS.valueOf) ||
      (updateUserInfosArgs.gmsPublishName == null &&
        orgUser.gmsPublishName &&
        orgUser.gmsPublishName.valueOf === PublishNameType.PUBLISH_NAME_ALIAS_OR_INITALS.valueOf))
  ) {
    logger.debug('changed GmsPublishNameType')
    return true
  }
  if (
    (updateUserInfosArgs.firstName != null && orgUser.firstName !== updateUserInfosArgs.firstName) ||
    (updateUserInfosArgs.lastName != null && orgUser.lastName !== updateUserInfosArgs.lastName)
  ) {
    logger.debug('changed User-Name')
    return true
  }
  if (
    updateUserInfosArgs.gmsAllowed != null &&
    orgUser.gmsAllowed !== updateUserInfosArgs.gmsAllowed
  ) {
    logger.debug('changed gmsAllowed')
    return true
  }
  if (
    updateUserInfosArgs.gmsPublishLocation != null &&
    orgUser.gmsPublishLocation !== updateUserInfosArgs.gmsPublishLocation
  ) {
    logger.debug('changed gmsPublishLocation')
    return true
  }
  if (
    updateUserInfosArgs.gmsPublishName != null &&
    orgUser.gmsPublishName !== updateUserInfosArgs.gmsPublishName
  ) {
    logger.debug('changed gmsPublishName')
    return true
  }
  if (updateUserInfosArgs.language != null && orgUser.language !== updateUserInfosArgs.language) {
    logger.debug('changed language')
    return true
  }
  if (updateUserInfosArgs.gmsLocation != null && orgUser.location === null) {
    logger.debug('changed gmsLocation1')
    return true
  }
  if (updateUserInfosArgs.gmsLocation === null && orgUser.location !== null) {
    logger.debug('changed gmsLocation2')
    return true
  }
  if (updateUserInfosArgs.gmsLocation != null && orgUser.location !== null) {
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
