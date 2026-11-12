// AI-GENERATED — not an architecture reference
import * as v from 'valibot'

/** A member as searchUsers lists them. */
export const searchedMemberSchema = v.object({
  userId: v.number(),
  firstName: v.string(),
  lastName: v.string(),
  alias: v.nullable(v.string()),
  // null for a member without an address: UserAdmin leaves both open, and the tab "all" lists them
  email: v.nullable(v.string()),
  creation: v.array(v.string()),
  emailChecked: v.nullable(v.boolean()),
  emailConfirmationSend: v.nullable(v.string()),
  deletedAt: v.nullable(v.string()),
  createdAt: v.string(),
  role: v.nullable(v.string()),
  creationAllowed: v.boolean(),
  gradidoID: v.string(),
  communityUuid: v.nullable(v.string()),
  findableOnMap: v.boolean(),
})

export type SearchedMember = v.InferOutput<typeof searchedMemberSchema>

export const searchUsersSchema = v.object({
  searchUsers: v.object({
    userCount: v.number(),
    userList: v.array(searchedMemberSchema),
  }),
})
