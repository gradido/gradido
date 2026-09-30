import { sendAccountActivationEmail } from 'core'
import { DbUser, dbFindProjectBrandingByAlias, ProjectBrandingSelect } from 'database'
import { Logger } from 'log4js'
import { parseOrThrowFirstIssue } from 'shared'
import { CONFIG } from '@/config'
import { getTimeDurationObject } from '@/util/time'
import { CreateUser, ProjectRegistration, projectRegistrationSchema } from './createUser.schema'
import { RegisterUserRole } from './RegisterUser.role'

export class RegisterUserForProjectRole extends RegisterUserRole<ProjectRegistration> {
  private projectBrandingPromise: Promise<ProjectBrandingSelect | undefined>

  constructor(createUserInput: CreateUser) {
    super(parseOrThrowFirstIssue(projectRegistrationSchema, createUserInput))
  }

  public async run(logger: Logger): Promise<number> {
    this.projectBrandingPromise = dbFindProjectBrandingByAlias(this.user.project)
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
      activationLink: `${activationLink}?project=${this.user.project}`,
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
