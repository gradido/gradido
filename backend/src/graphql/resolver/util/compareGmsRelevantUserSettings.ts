import { Point } from '@dbTools/typeorm'
import { User as DbUser } from '@entity/User'

import { LogError } from '@/server/LogError'
import { backendLogger as logger } from '@/server/logger'

import { Point2Location } from './Location2Point'

export function compareGmsRelevantUserSettings(orgUser: DbUser, changedUser: DbUser): boolean {
  if (!orgUser && !changedUser) {
    throw new LogError('comparison without any user is impossible')
  }
  logger.debug('compareGmsRelevantUserSettings:', orgUser, changedUser)
  if (orgUser.alias !== changedUser.alias) {
    return true
  }
  if (orgUser.firstName !== changedUser.firstName || orgUser.lastName !== changedUser.lastName) {
    return true
  }
  if (orgUser.gmsAllowed !== changedUser.gmsAllowed) {
    return true
  }
  if (orgUser.gmsPublishLocation !== changedUser.gmsPublishLocation) {
    return true
  }
  if (orgUser.gmsPublishName !== changedUser.gmsPublishName) {
    return true
  }
  if (orgUser.language !== changedUser.language) {
    return true
  }
  if (orgUser.location === null && changedUser.location !== null) {
    return true
  }
  if (orgUser.location !== null && changedUser.location === null) {
    return true
  }
  if (orgUser.location !== null && changedUser.location !== null) {
    const orgLocation = Point2Location(orgUser.location as Point)
    const changedLocation = Point2Location(changedUser.location as Point)
    if (
      orgLocation.latitude !== changedLocation.latitude ||
      orgLocation.longitude !== changedLocation.longitude
    ) {
      return true
    }
  }
  return false
}
