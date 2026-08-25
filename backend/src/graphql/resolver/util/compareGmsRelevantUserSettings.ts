import { User as DbUser, UserLoggingView } from 'database'
import { getLogger } from 'log4js'
import { Point } from 'typeorm'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { UpdateUserInfosArgs } from '@/graphql/arg/UpdateUserInfosArgs'
import { GmsPublishLocationType } from '@/graphql/enum/GmsPublishLocationType'
import { LogError } from '@/server/LogError'
import { Point2Location } from './Location2Point'

const logger = getLogger(
  `${LOG4JS_BASE_CATEGORY_NAME}.graphql.resolver.util.compareGmsRelevantUserSettings`,
)

export function compareGmsRelevantUserSettings(
  orgUser: DbUser,
  updateUserInfosArgs: UpdateUserInfosArgs,
): boolean {
  if (!orgUser) {
    throw new LogError('comparison without any user is impossible')
  }
  logger.debug('compareGmsRelevantUserSettings:', new UserLoggingView(orgUser), updateUserInfosArgs)
  // A changed alias always has to reach the GMS. It used to depend on the publish-name
  // setting standing at ALIAS_OR_INITIALS -- but since NU-024 the alias travels
  // unconditionally (`GmsUser` sets it from the user, the setting no longer steers it),
  // so a member whose setting still reads FULL from the old days would have kept an
  // outdated alias over there for good.
  if (updateUserInfosArgs.alias && orgUser.alias !== updateUserInfosArgs.alias) {
    return true
  }
  if (
    (updateUserInfosArgs.firstName && orgUser.firstName !== updateUserInfosArgs.firstName) ||
    (updateUserInfosArgs.lastName && orgUser.lastName !== updateUserInfosArgs.lastName)
  ) {
    return true
  }
  if (
    updateUserInfosArgs.gmsAllowed !== undefined &&
    updateUserInfosArgs.gmsAllowed &&
    orgUser.gmsAllowed !== updateUserInfosArgs.gmsAllowed
  ) {
    return true
  }
  if (
    updateUserInfosArgs.gmsPublishLocation !== undefined &&
    (orgUser.gmsPublishLocation as GmsPublishLocationType) !==
      updateUserInfosArgs.gmsPublishLocation
  ) {
    return true
  }
  if (updateUserInfosArgs.language && orgUser.language !== updateUserInfosArgs.language) {
    return true
  }
  // Checked against undefined rather than for a value: clearing the text arrives as
  // null or as an empty string, and both are changes that have to reach the GMS.
  // Deleting what one wrote about oneself is the case that matters here - anything
  // else would leave the old text published while it is gone locally.
  if (
    updateUserInfosArgs.aboutMe !== undefined &&
    orgUser.aboutMe !== updateUserInfosArgs.aboutMe
  ) {
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
