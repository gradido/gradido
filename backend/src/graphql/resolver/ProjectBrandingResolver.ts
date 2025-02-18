import { ProjectBranding as DbProjectBranding } from '@entity/ProjectBranding'
import { Resolver, Query, Mutation, Arg, Int, Authorized, ID } from 'type-graphql'

import { ProjectBrandingInput } from '@input/ProjectBrandingInput'
import { ProjectBranding } from '@model/ProjectBranding'
import { Space } from '@model/Space'
import { SpaceList } from '@model/SpaceList'

import { HumHubClient } from '@/apis/humhub/HumHubClient'
import { RIGHTS } from '@/auth/RIGHTS'
import { LogError } from '@/server/LogError'
import { backendLogger as logger } from '@/server/logger'

@Resolver(() => ProjectBranding)
export class ProjectBrandingResolver {
  @Query(() => [ProjectBranding])
  @Authorized([RIGHTS.PROJECT_BRANDING_VIEW])
  async projectBrandings(): Promise<ProjectBranding[]> {
    return (await DbProjectBranding.find()).map(
      (entity: DbProjectBranding) => new ProjectBranding(entity),
    )
  }

  @Query(() => ProjectBranding, { nullable: true })
  @Authorized([RIGHTS.PROJECT_BRANDING_VIEW])
  async projectBranding(@Arg('id', () => Int) id: number): Promise<ProjectBranding | null> {
    const projectBrandingEntity = await DbProjectBranding.findOneBy({ id })
    if (!projectBrandingEntity) {
      throw new LogError(`Project Branding with id: ${id} not found`)
    }
    return new ProjectBranding(projectBrandingEntity)
  }

  @Query(() => String, { nullable: true })
  @Authorized([RIGHTS.PROJECT_BRANDING_BANNER])
  async projectBrandingBanner(@Arg('alias', () => String) alias: string): Promise<string | null> {
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
    @Arg('input') input: ProjectBrandingInput,
  ): Promise<ProjectBranding | null> {
    const projectBranding = input.id
      ? await DbProjectBranding.findOneOrFail({ where: { id: input.id } })
      : new DbProjectBranding()

    Object.assign(projectBranding, input)
    await projectBranding.save()

    return new ProjectBranding(projectBranding)
  }

  @Mutation(() => Boolean)
  @Authorized([RIGHTS.PROJECT_BRANDING_MUTATE])
  async deleteProjectBranding(@Arg('id', () => ID) id: number): Promise<boolean> {
    try {
      await DbProjectBranding.delete({ id })
      return true
    } catch (err) {
      logger.error(err)
      return false
    }
  }

  @Query(() => Space)
  @Authorized([RIGHTS.LIST_HUMHUB_SPACES])
  async space(@Arg('id', () => ID) id: number): Promise<Space> {
    const humhub = HumHubClient.getInstance()
    if (!humhub) {
      throw new LogError('HumHub client not initialized')
    }

    const space = await humhub.space(id)
    if (!space) {
      throw new LogError(`Error requesting space with id: ${id} from HumHub`)
    }
    return new Space(space)
  }

  @Query(() => SpaceList)
  @Authorized([RIGHTS.LIST_HUMHUB_SPACES])
  async spaces(
    @Arg('page', () => Int, { defaultValue: 1 }) page: number,
    @Arg('limit', () => Int, { defaultValue: 20 }) limit: number,
  ): Promise<SpaceList> {
    const humhub = HumHubClient.getInstance()
    if (!humhub) {
      throw new LogError('HumHub client not initialized')
    }
    const offset = (page - 1) * limit
    const spaces = await humhub.spaces(offset, limit)
    if (!spaces) {
      throw new LogError('Error requesting spaces from HumHub')
    }
    return new SpaceList(spaces)
  }
}
