import { Field, ObjectType } from 'type-graphql'

// Result of the rewrite call (E-017 / E-019). Besides the fresh reply text, a confirm
// rewrite also carries memoSupplement — a short, community-facing note the moderator
// appends to the public contribution ("Text ergaenzen"). memoSupplement is null for
// inquire/deny rewrites (Crea only writes it when the target decision is "confirm").
@ObjectType()
export class CreaRewriteResult {
  @Field()
  responseText: string

  @Field(() => String, { nullable: true })
  memoSupplement?: string | null
}
