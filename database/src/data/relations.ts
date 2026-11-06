import { UserContactSelect, UserRoleSelect, UserSelect } from '../schemas'

/**
 * A `users` row together with the address in force for it -- the shape almost everything
 * above the database means when it says "the user". The TypeORM entity carries the same
 * pair as `User` + `User.emailContact`, which is why the consumers of both take
 * `DbUser | User` while the translation is under way.
 *
 * ⚠️ The two spell the id differently: the entity has `gradidoID`, the row `gradidoId`.
 * Whoever accepts both reads it through `gradidoIdOf` rather than picking one.
 */
export type DbUser = UserSelect & {
  emailContact: UserContactSelect
}

/** What {@link dbFindUserLoginByEmail} hands back: a {@link DbUser} plus the two things
 * the login answer needs and the row cannot carry -- the member's role and the small
 * rendition of their picture. Both null where there is none. */
export type DbLoginUser = DbUser & {
  role: UserRoleSelect | null
  avatar: Buffer | null
}
