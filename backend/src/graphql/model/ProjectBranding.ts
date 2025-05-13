import { ProjectBranding as dbProjectBranding } from '@entity/ProjectBranding'
import { Field, Int, ObjectType } from 'type-graphql'

@ObjectType()
export class ProjectBranding {
  constructor(projectBranding: dbProjectBranding) {
    Object.assign(this, projectBranding)
  }

  @Field(() => Int)
  id: number

  @Field(() => String)
  name: string

  @Field(() => String)
  alias: string

  @Field(() => String, { nullable: true })
  description: string | null

  @Field(() => Int, { nullable: true })
  spaceId: number | null

  @Field(() => String, { nullable: true })
  spaceUrl: string | null

  @Field(() => Boolean)
  newUserToSpace: boolean

  @Field(() => String, { nullable: true })
  logoUrl: string | null
}
