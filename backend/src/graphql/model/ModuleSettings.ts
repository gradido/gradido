// AI-GENERATED — not an architecture reference
import { Field, ObjectType } from 'type-graphql'

// The per-instance module switches shown in the admin panel. `matchingActive` is the
// stored switch an admin flips; `gmsActive` is READ-ONLY here - it is the server config
// value for the transfer to the old gms.gradido.net, shown so an admin can see what this
// instance does without having to ask for the server config. It is a live production
// function and moving its control into the admin UI is a separate decision.
@ObjectType()
export class ModuleSettings {
  @Field()
  matchingActive: boolean

  @Field()
  gmsActive: boolean
}

// What an ordinary member may know: which modules this instance offers, so the wallet can
// decide whether to show them at all. Deliberately narrower than ModuleSettings - it
// carries no server configuration, only what the client needs to render itself.
@ObjectType()
export class ActiveModules {
  @Field()
  matchingActive: boolean
}
