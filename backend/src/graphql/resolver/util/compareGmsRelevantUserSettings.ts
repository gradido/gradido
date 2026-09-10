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
  // A first position where there was none.
  if (updateUserInfosArgs.gmsLocation && orgUser.location === null) {
    return true
  }
  // ⛔ A branch for "the member cleared their position" stood here and could never be true:
  // it asked for `gmsLocation` to be truthy AND strictly null at once. Removed rather than
  // corrected, because there is nothing for it to answer -- REMOVING a position does not
  // exist. `UserResolver` writes the column only `if (gmsLocation)`, so null means "leave
  // it alone" there, and no caller in the wallet or the admin has ever sent one; measured
  // 10.09.2026. Whoever builds "remove my position" needs three things, not one: a way to
  // ask for it, a resolver that tells "leave alone" from "clear", and this clause back.
  if (updateUserInfosArgs.gmsLocation && orgUser.location !== null) {
    const orgLocation = Point2Location(orgUser.location as Point)
    const changedLocation = updateUserInfosArgs.gmsLocation
    if (
      // A stored point without coordinates is no place at all, so whatever is sent now is
      // a change. That was already the answer before Point2Location could say null -- the
      // empty Location fell through the two comparisons below to the same true -- and it
      // is spelled out here so the null cannot quietly turn it into false.
      !orgLocation ||
      orgLocation.latitude !== changedLocation.latitude ||
      orgLocation.longitude !== changedLocation.longitude
    ) {
      return true
    }
  }
  return false
}
