// AI-GENERATED — not an architecture reference
import { Field, ObjectType } from 'type-graphql'

/**
 * What the helper page may show about a parked registration attempt (EM-013): the
 * guest's name, so host and guest see they are completing the right attempt — and
 * nothing else. The guest's name deliberately never travels in the mail itself; it
 * only appears here, behind the assist code.
 */
@ObjectType()
export class AssistedRegistrationInfo {
  @Field(() => String)
  firstName: string

  @Field(() => String)
  lastName: string
}

/**
 * The answer to a completed assisted registration. The redeem code is handed back so
 * the helper page can send the guest straight into the existing redeem flow
 * (`/login/{code}`) — sign in, and the cheque credit follows the paths that exist.
 */
@ObjectType()
export class AssistedRegistrationResult {
  @Field(() => String)
  redeemCode: string
}
