import {
  CommunitiesSelect,
  UserContactInsert,
  UserContactSelect,
  UserInsert,
  UserRoleSelect,
  UserSelect,
} from './drizzle.schema'
/**
 * A user together with the rows written alongside it. Replaces the
 * TypeORM entity user, so field names follow the drizzle
 * schema (`gradidoId`, not `gradidoID`).
 */
export type FullUser = UserSelect & {
  community?: CommunitiesSelect | null
  emailContact: UserContactSelect
  userRoles: UserRoleSelect[]
}

export type UserWithContact = UserSelect & {
  emailContact: UserContactSelect
}

export type UserInserted = UserInsert & {
  id: number
}

export type UserInsertedWithContact = UserInserted & {
  emailContact: UserContactInsert
}
