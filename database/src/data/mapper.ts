import * as v from 'valibot'
import { User } from '../entity'
import { dbFindCommunityByUuid, getHomeCommunityDrizzle } from '../queries'
import {
  CommunitiesSelect,
  UserSelect,
  userContactSelectSchema,
  userRoleSelectSchema,
  userSelectSchema,
} from '../schemas'
import { DbLoginUser, DbUserCommunity } from './relations'

// TypeORM reads a bigint column as decimal text (bigNumberStrings in AppDatabase), the row carries bigint.
const bigintText = v.nullable(
  v.pipe(
    v.union([v.string(), v.bigint()]),
    v.transform((text) => BigInt(text)),
  ),
)
const legacyUserSchema = v.object({ ...userSelectSchema.entries, password: bigintText })
const legacyContactSchema = v.object({
  ...userContactSelectSchema.entries,
  emailVerificationCode: bigintText,
  changeVetoCode: bigintText,
})

export function typeOrmUserToUserSelect(user: User): UserSelect {
  return {
    ...v.parse(legacyUserSchema, {
      ...user,
      gradidoId: user.gradidoID,
      hideAmountGdd: user.hideAmountGDD,
      hideAmountGdt: user.hideAmountGDT,
    }),
  }
}

/**
 * A TypeORM `User` loaded with `emailContact` and `userRole`, as the API hands the member of a
 * request to legacy code, in the shape {@link dbFindUserLoginByEmail} answers.
 */
export function typeOrmUserToDbLoginUser(user: User, avatar?: Buffer): DbLoginUser {
  return {
    // the three fields the entity spells differently from the row
    ...typeOrmUserToUserSelect(user),
    emailContact: v.parse(legacyContactSchema, user.emailContact),
    role: v.parse(v.nullable(userRoleSelectSchema), user.userRole),
    avatar: avatar ?? null,
  }
}

export async function typeOrmUserToDbUserCommunity(user: User): Promise<DbUserCommunity> {
  let userCom: CommunitiesSelect | null = await getHomeCommunityDrizzle()
  if (user.communityUuid !== userCom.communityUuid) {
    userCom = await dbFindCommunityByUuid(user.communityUuid)
    if (!userCom) {
      throw new Error(`Missing community of foreign user: ${user.id}`)
    }
  }
  return {
    ...typeOrmUserToUserSelect(user),
    community: userCom,
  }
}
