import { Field, ObjectType } from 'type-graphql'

// Build info of the running backend, returned by the public `version` query.
// `commit` is the deployed commit SHA, `source` says how it was resolved (git |
// env | unknown). Lets backend-only deploys be verified from outside — the
// frontend/admin bundle hashes only track their own builds.
@ObjectType()
export class BackendVersion {
  @Field()
  commit: string

  @Field()
  source: string
}
