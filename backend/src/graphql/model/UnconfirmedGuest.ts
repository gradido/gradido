// AI-GENERATED — not an architecture reference
import { Field, ObjectType } from 'type-graphql'

/**
 * A guest the member vouched for at the table who has not confirmed their address yet
 * (E-020), as the member sees them under their table code.
 *
 * ⚠️ With first and last name, on purpose: a named exception to NU-018/NU-024, under which
 * another member otherwise sees the user name only (`PublishName.logic.ts`). These are guests
 * the member invited in person, who typed their names in the member's presence; the member
 * sees only their own guests, and only while they are unconfirmed - no picture, no address.
 * The guest is told on the registration form (`site.signup.presenceHint`). It is also the line
 * the member sends to support when a dead guest account has to be deleted.
 */
@ObjectType()
export class UnconfirmedGuest {
  // Nullable like the columns behind them (`users.first_name`, `users.last_name` are
  // `nullable: true`), not like their TypeScript type says. A non-null field over one of
  // them lets a single row without a name take the whole answer down: the null travels up
  // through `[UnconfirmedGuest!]!` to `presenceCode`, and the member sees no code at all
  // until somebody repairs that other account.
  @Field(() => String, { nullable: true })
  firstName: string | null

  @Field(() => String, { nullable: true })
  lastName: string | null

  // A guest may not have chosen a user name yet.
  @Field(() => String, { nullable: true })
  alias: string | null

  @Field(() => Date)
  createdAt: Date
}
