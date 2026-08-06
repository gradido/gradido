// AI-GENERATED — not an architecture reference
import { IsBoolean } from 'class-validator'
import { Field, InputType } from 'type-graphql'

// Admin input for the module switches. Only the switches an admin may actually
// flip belong here: gmsActive is deliberately absent, it is read-only server config.
@InputType()
export class ModuleSettingsInput {
  @Field()
  @IsBoolean()
  matchingActive: boolean
}
