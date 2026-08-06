import { Field, ObjectType } from 'type-graphql'

// The per-instance module switches shown in the admin panel (E-002). `matchingActive`
// is the stored switch an admin flips; `gmsActive` is READ-ONLY here - it is the server
// config value for the transfer to the old gms.gradido.net, shown so an admin can see
// what this instance does without having to ask for the server config. It is a live
// production function and moving its control into the admin UI is a separate decision.
@ObjectType()
export class ModuleSettings {
  @Field()
  matchingActive: boolean

  @Field()
  gmsActive: boolean
}
