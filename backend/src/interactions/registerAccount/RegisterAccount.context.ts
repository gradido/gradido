// AI-GENERATED — not an architecture reference
import { OptInType } from '@enum/OptInType'
import { PasswordEncryptionType } from '@enum/PasswordEncryptionType'
import { UserContactType } from '@enum/UserContactType'
import {
  registerAddressTransaction,
  sendAccountActivationEmail,
  sendAssistedRegistrationConfirmEmail,
  validateAlias,
} from 'core'
import {
  ALIAS_ORIGIN_ASSIGNED,
  ALIAS_ORIGIN_CHOSEN,
  type AliasOrigin,
  AppDatabase,
  aliasExists,
  ContributionLink as DbContributionLink,
  TransactionLink as DbTransactionLink,
  User as DbUser,
  UserContact as DbUserContact,
  dbFindProjectBrandingByAlias,
  dbInsertUserAlias,
  getHomeCommunity,
  ProjectBrandingSelect,
  UserLoggingView,
} from 'database'
import { Logger } from 'log4js'
import random from 'random-bigint'
import { aliasCandidates, aliasSchema, pickFreeAlias } from 'shared'
import { v4 as uuidv4 } from 'uuid'
import { CONFIG } from '@/config'
import { EVENT_EMAIL_CONFIRMATION, EVENT_USER_REGISTER, Event, EventType } from '@/event/Events'
import { sendUsersToGms } from '@/graphql/resolver/util/sendUserToGms'
import { syncHumhub } from '@/graphql/resolver/util/syncHumhub'
import { encryptPassword } from '@/password/PasswordEncryptor'
import { LogError } from '@/server/LogError'
import { getTimeDurationObject } from '@/util/time'

const db = AppDatabase.getInstance()

/**
 * Everything a new account is made of. Moved verbatim out of `createUser` so the
 * assisted registration (EM-013) does not grow a second copy of this flow — the two
 * callers differ in exactly two places, both switched by `passwordPlain`:
 *
 *   - `passwordPlain: null` — the classic registration: the account has no password
 *     yet, the activation mail carries the set-password link. Behaviour is 1:1 what
 *     `createUser` always did; its existing tests are the proof.
 *   - `passwordPlain` set — an assisted registration: the guest typed their password
 *     at the table, so it is set right away and the mail only asks them to CONFIRM
 *     the address (a confirm-only link, not the set-password page).
 *
 * The caller has already normalised the input: email trimmed and lowercased, language
 * validated, and the address checked to be free.
 */
export interface RegisterAccountInput {
  email: string
  firstName: string
  lastName: string
  language: string
  publisherId: number | null
  redeemCode: string | null
  project: string | null
  alias: string | null
  passwordPlain: string | null
}

const newEmailContact = (email: string, userId: number, logger: Logger): DbUserContact => {
  logger.trace(`newEmailContact...`)
  const emailContact = new DbUserContact()
  emailContact.email = email
  emailContact.userId = userId
  emailContact.type = UserContactType.USER_CONTACT_EMAIL
  emailContact.emailChecked = false
  emailContact.emailOptInTypeId = OptInType.EMAIL_OPT_IN_REGISTER
  emailContact.emailVerificationCode = random(64).toString()
  logger.debug('newEmailContact...successful', emailContact)
  return emailContact
}

const newGradidoID = async (logger: Logger): Promise<string> => {
  let gradidoId: string
  let countIds: number
  do {
    gradidoId = uuidv4()
    countIds = await DbUser.count({ where: { gradidoID: gradidoId } })
    if (countIds > 0) {
      logger.info('Gradido-ID creation conflict...')
    }
  } while (countIds > 0)
  return gradidoId
}

export const registerAccount = async (
  input: RegisterAccountInput,
  logger: Logger,
): Promise<DbUser> => {
  const { email, firstName, lastName, language, publisherId, redeemCode, project, alias } = input

  let projectBrandingPromise: Promise<ProjectBrandingSelect | undefined> | undefined
  if (project) {
    projectBrandingPromise = dbFindProjectBrandingByAlias(project)
  }
  const gradidoID = await newGradidoID(logger)

  const eventRegisterRedeem = Event(
    EventType.USER_REGISTER_REDEEM,
    { id: 0 } as DbUser,
    { id: 0 } as DbUser,
  )
  let dbUser = new DbUser()
  const homeCom = await getHomeCommunity()
  if (!homeCom) {
    logger.error('no home community found, please start the dht-node first')
    throw new Error(
      `Error creating user, please write the support team: ${CONFIG.COMMUNITY_SUPPORT_MAIL}`,
    )
  }
  if (homeCom.communityUuid) {
    dbUser.communityUuid = homeCom.communityUuid
  }

  dbUser.gradidoID = gradidoID
  dbUser.firstName = firstName
  dbUser.lastName = lastName
  dbUser.language = language
  // enable humhub from now on for new user
  dbUser.humhubAllowed = true
  if (alias && (await validateAlias(alias))) {
    dbUser.alias = alias
  }
  dbUser.publisherId = publisherId ?? 0
  dbUser.passwordEncryptionType = PasswordEncryptionType.NO_PASSWORD
  if (input.passwordPlain) {
    // Assisted registration: the guest chose their password at the table. Type first,
    // then encrypt — the derivation salts by the gradidoID, which is set above.
    dbUser.passwordEncryptionType = PasswordEncryptionType.GRADIDO_ID
    dbUser.password = await encryptPassword(dbUser, input.passwordPlain)
  }

  if (logger.isDebugEnabled()) {
    logger.debug('new dbUser', new UserLoggingView(dbUser))
  }
  if (redeemCode) {
    if (redeemCode.match(/^CL-/)) {
      const contributionLink = await DbContributionLink.findOne({
        where: { code: redeemCode.replace('CL-', '') },
      })
      if (contributionLink) {
        logger.info('redeemCode found contributionLink', contributionLink.id)
        dbUser.contributionLinkId = contributionLink.id
        eventRegisterRedeem.involvedContributionLink = contributionLink
      }
    } else {
      const transactionLink = await DbTransactionLink.findOne({ where: { code: redeemCode } })
      if (transactionLink) {
        logger.info('redeemCode found transactionLink', transactionLink.id)
        dbUser.referrerId = transactionLink.userId
        eventRegisterRedeem.involvedTransactionLink = transactionLink
      }
    }
  }

  const queryRunner = db.getDataSource().createQueryRunner()
  await queryRunner.connect()
  await queryRunner.startTransaction('REPEATABLE READ')
  let projectBranding: ProjectBrandingSelect | undefined
  try {
    dbUser = await queryRunner.manager.save(dbUser).catch((error) => {
      throw new LogError('Error while saving dbUser', error)
    })
    let emailContact = newEmailContact(email, dbUser.id, logger)
    emailContact = await queryRunner.manager.save(emailContact).catch((error) => {
      throw new LogError('Error while saving user email contact', error)
    })

    dbUser.emailContact = emailContact
    dbUser.emailId = emailContact.id
    dbUser = await queryRunner.manager.save(dbUser).catch((error) => {
      throw new LogError('Error while updating dbUser', error)
    })

    // Everybody holds a name from here on. Migration 0116 covers the members who
    // existed when it ran; without this, every account opened after it would carry
    // none again - and since a transaction stores `sender.alias`, their rows would
    // have nothing where a name belongs.
    //
    // A name the system builds is a proposal: it is reserved for them and can be
    // taken back, but it costs none of their four picks until they adopt it.
    let aliasOrigin: AliasOrigin = ALIAS_ORIGIN_CHOSEN
    if (!dbUser.alias) {
      aliasOrigin = ALIAS_ORIGIN_ASSIGNED
      dbUser.alias = await pickFreeAlias(
        aliasCandidates(dbUser.firstName, dbUser.lastName, email),
        dbUser.id,
        aliasExists,
      )
      // The ladder decides what to offer, the schema decides what may be written.
      aliasSchema.parse(dbUser.alias)
      dbUser = await queryRunner.manager.save(dbUser).catch((error) => {
        throw new LogError('Error while storing the generated alias', error)
      })
    }
    await dbInsertUserAlias(
      dbUser.id,
      dbUser.alias,
      dbUser.communityUuid,
      aliasOrigin,
      queryRunner.manager,
    )

    projectBranding = projectBrandingPromise ? await projectBrandingPromise : undefined
    if (input.passwordPlain) {
      // The password already exists, so the set-password page would be the wrong door:
      // this link only confirms that the address belongs to the guest (EM-013).
      const confirmLink = `${CONFIG.EMAIL_LINK_CONFIRM_EMAIL}${emailContact.emailVerificationCode.toString()}`
      await sendAssistedRegistrationConfirmEmail({
        firstName,
        lastName,
        email,
        language,
        confirmLink,
        timeDurationObject: getTimeDurationObject(CONFIG.EMAIL_CODE_VALID_TIME),
      })
      logger.info('sendAssistedRegistrationConfirmEmail')
    } else {
      const activationLink = `${
        CONFIG.EMAIL_LINK_VERIFICATION
      }${emailContact.emailVerificationCode.toString()}${redeemCode ? `/${redeemCode}` : ''}${
        project ? `?project=` + project : ''
      }`

      await sendAccountActivationEmail({
        firstName,
        lastName,
        email,
        language,
        activationLink,
        timeDurationObject: getTimeDurationObject(CONFIG.EMAIL_CODE_VALID_TIME),
        logoUrl: projectBranding?.logoUrl,
      })
      logger.info('sendAccountActivationEmail')
    }

    await EVENT_EMAIL_CONFIRMATION(dbUser)

    await queryRunner.commitTransaction()
    logger.addContext('user', dbUser.id)
  } catch (e) {
    await queryRunner.rollbackTransaction()
    throw new LogError('Error creating user', e)
  } finally {
    await queryRunner.release()
  }
  // register user into blockchain
  const dltTransactionPromise = registerAddressTransaction(dbUser, homeCom)
  logger.info('registerAccount() successful...')
  if (CONFIG.HUMHUB_ACTIVE) {
    let spaceId: number | null = null
    if (projectBranding) {
      spaceId = projectBranding.spaceId
    }
    try {
      await syncHumhub(null, dbUser, dbUser.gradidoID, spaceId)
    } catch (e) {
      logger.error("registerAccount: couldn't reach out to humhub, disable for now", e)
    }
  }

  if (redeemCode) {
    eventRegisterRedeem.affectedUser = dbUser
    eventRegisterRedeem.actingUser = dbUser
    await eventRegisterRedeem.save()
  } else {
    await EVENT_USER_REGISTER(dbUser)
  }

  if (!CONFIG.GMS_ACTIVE) {
    logger.info('GMS deactivated per configuration! New user is not published to GMS.')
  } else {
    try {
      if (dbUser.gmsAllowed && !dbUser.gmsRegistered) {
        await sendUsersToGms([dbUser], homeCom)
      }
    } catch (err) {
      if (CONFIG.GMS_CREATE_USER_THROW_ERRORS) {
        throw new LogError('Error publishing new created user to GMS:', err)
      } else {
        logger.error('Error publishing new created user to GMS:', err)
      }
    }
  }
  // wait for finishing dlt transaction
  const startTime = new Date()
  await dltTransactionPromise
  const endTime = new Date()
  logger.info(
    `dlt-connector register address finished in ${endTime.getTime() - startTime.getTime()} ms`,
  )
  return dbUser
}
