import { ProjectBranding as DbProjectBranding } from '@entity/ProjectBranding'
import { Resolver, Query, Mutation, Arg, Int, Authorized } from 'type-graphql'

import { ProjectBrandingInput } from '@input/ProjectBrandingInput'
import { ProjectBranding } from '@model/ProjectBranding'

import { RIGHTS } from '@/auth/RIGHTS'
import { LogError } from '@/server/LogError'
import { backendLogger as logger } from '@/server/logger'

@Resolver()
export class ProjectBrandingResolver {
  @Query(() => [ProjectBranding])
  @Authorized([RIGHTS.PROJECT_BRANDING_VIEW])
  async getProjectBrandings(): Promise<ProjectBranding[]> {
    return (await DbProjectBranding.find()).map(
      (entity: DbProjectBranding) => new ProjectBranding(entity),
    )
  }

  @Query(() => ProjectBranding, { nullable: true })
  @Authorized([RIGHTS.PROJECT_BRANDING_VIEW])
  async getProjectBranding(@Arg('id', () => Int) id: number): Promise<ProjectBranding | null> {
    const projectBrandingEntity = await DbProjectBranding.findOneBy({ id })
    if (!projectBrandingEntity) {
      throw new LogError(`Project Branding with id: ${id} not found`)
    }
    return new ProjectBranding(projectBrandingEntity)
  }

  @Query(() => String, { nullable: true })
  @Authorized([RIGHTS.PROJECT_BRANDING_BANNER])
  async getProjectBrandingBanner(
    @Arg('alias', () => String) alias: string,
  ): Promise<string | null> {
    const projectBrandingEntity = await DbProjectBranding.findOne({
      where: { alias },
      select: { logoUrl: true },
    })
    if (!projectBrandingEntity) {
      throw new LogError(`Project Branding with alias: ${alias} not found`)
    }
    return projectBrandingEntity.logoUrl
  }

  @Mutation(() => ProjectBranding, { nullable: true })
  @Authorized([RIGHTS.PROJECT_BRANDING_MUTATE])
  async upsertProjectBranding(
    @Arg('data') data: ProjectBrandingInput,
  ): Promise<ProjectBranding | null> {
    const projectBranding = data.id
      ? await DbProjectBranding.findOneOrFail({ where: { id: data.id } })
      : new DbProjectBranding()

    Object.assign(projectBranding, data)
    await projectBranding.save()

    return new ProjectBranding(projectBranding)
  }

  @Mutation(() => Boolean)
  @Authorized([RIGHTS.PROJECT_BRANDING_MUTATE])
  async deleteProjectBranding(@Arg('id', () => Int) id: number): Promise<boolean> {
    try {
      await DbProjectBranding.delete({ id })
      return true
    } catch (err) {
      logger.error(err)
      return false
    }
  }
}
