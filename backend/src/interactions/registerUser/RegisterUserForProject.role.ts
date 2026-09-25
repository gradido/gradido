import { sendAccountActivationEmail } from 'core'
import { DbUser, dbFindProjectBrandingByAlias, ProjectBrandingSelect } from 'database'
import { Logger } from 'log4js'
import { CONFIG } from '@/config'
import { getTimeDurationObject } from '@/util/time'
import { CreateUser } from './createUser.schema'
import { RegisterUserRole } from './RegisterUser.role'

export class RegisterUserForProjectRole extends RegisterUserRole {
  private project: string
  private projectBrandingPromise: Promise<ProjectBrandingSelect | undefined>

  constructor(user: CreateUser) {
    if (!user.project) {
      throw new Error('Missing project Code')
    }

    super(user)
    this.project = user.project
  }

  public async run(logger: Logger): Promise<number> {
    this.projectBrandingPromise = dbFindProjectBrandingByAlias(this.project)
    return super.run(logger)
  }

  public async sendAccountActivationEmail(activationLink: string): Promise<boolean> {
    const { firstName, lastName, language, email } = this.user
    const projectBranding = await this.projectBrandingPromise
    const result = await sendAccountActivationEmail({
      firstName,
      lastName,
      email,
      language,
      activationLink: `${activationLink}?project=${this.project}`,
      timeDurationObject: getTimeDurationObject(CONFIG.EMAIL_CODE_VALID_TIME),
      logoUrl: projectBranding?.logoUrl,
    })
    if (result instanceof Error) {
      throw result
    }
    return result !== null
  }

  public async syncHumhub(
    user: DbUser,
    logger: Logger,
    spaceId: number | null = null,
  ): Promise<void> {
    const projectBranding = await this.projectBrandingPromise
    return super.syncHumhub(user, logger, projectBranding?.spaceId)
  }
}
