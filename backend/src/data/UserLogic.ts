import { RoleNames } from '@enum/RoleNames'
import { DbUser, User, UserRole } from 'database'

export class UserLogic {
  public constructor(private self: User) {}
  public isRole(role: RoleNames): boolean {
    return this.self.userRoles.some((value: UserRole) => value.role === role.toString())
  }
}

/**
 * Which of the two user shapes this is: the TypeORM entity, or a Drizzle `users` row.
 *
 * ⛔ Asked STRUCTURALLY, by the property that differs, and not with `instanceof User`.
 * That distinction is the whole reason this function exists rather than the one-liner at
 * each call site. Plenty of the entity-shaped users in this house are object literals cast
 * to `User` and never constructed through it -- the community's stand-in
 * (`util/communityUser.ts`) is one in PRODUCTION code, and the test fixtures are full of
 * them. `instanceof` reads every one of those as a Drizzle row, takes the other branch,
 * and finds `undefined` there: the stand-in lost its gradidoID that way, and it is the
 * linkedUser on every CREATION row of every booking list, where the field is `String!`.
 *
 * Nothing is lost against `instanceof`: a real Drizzle row has no `gradidoID` at all, and
 * an entity that has none was loaded without it, in which case neither branch has an id
 * to give.
 */
export const isLegacyUser = (user: User | DbUser): user is User =>
  (user as User).gradidoID !== undefined

/**
 * The member's gradido id, whichever of the two shapes is in hand.
 *
 * The TypeORM entity spells it `gradidoID`, a Drizzle `users` row spells it `gradidoId`,
 * and while the translation is under way a good many functions have to take either. Every
 * one of them needs this one line, and getting it wrong is silent: the property is simply
 * `undefined`, which then travels on as a salt, a HumHub username or a token payload.
 *
 * ⛔ To be deleted together with the entity, not extended. One place to look for when the
 * last `User` is gone.
 */
export const gradidoIdOf = (user: User | DbUser): string =>
  isLegacyUser(user) ? user.gradidoID : user.gradidoId
