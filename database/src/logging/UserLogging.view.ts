import { User } from '../entity'
import { AbstractLoggingView } from './AbstractLogging.view'
import { CommunityLoggingView } from './CommunityLogging.view'
import { ContributionLoggingView } from './ContributionLogging.view'
import { ContributionMessageLoggingView } from './ContributionMessageLogging.view'
import { UserContactLoggingView } from './UserContactLogging.view'
import { UserRoleLoggingView } from './UserRoleLogging.view'

enum PasswordEncryptionType {
  NO_PASSWORD = 0,
  EMAIL = 1,
  GRADIDO_ID = 2,
}

export class UserLoggingView extends AbstractLoggingView {
  public constructor(private self: User) {
    super()
  }

  public toJSON(): any {
    return {
      id: this.self.id,
      foreign: this.self.foreign,
      gradidoID: this.self.gradidoID,
      community: this.self.community
        ? new CommunityLoggingView(this.self.community).toJSON()
        : { id: this.self.communityUuid },
      alias: this.self.alias?.substring(0, 3) + '...',
      emailContact: this.self.emailContact
        ? new UserContactLoggingView(this.self.emailContact, false).toJSON()
        : { id: this.self.emailId },
      firstName: this.self.firstName?.substring(0, 3) + '...',
      lastName: this.self.lastName?.substring(0, 3) + '...',
      createdAt: this.dateToString(this.self.createdAt),
      deletedAt: this.dateToString(this.self.deletedAt),
      passwordEncryptionType: PasswordEncryptionType[this.self.passwordEncryptionType],
      language: this.self.language,
      hideAmountGDD: this.self.hideAmountGDD,
      hideAmountGDT: this.self.hideAmountGDT,
      userRoles: this.self.userRoles
        ? this.self.userRoles.map((userRole) => new UserRoleLoggingView(userRole, false).toJSON())
        : undefined,
      referrerId: this.self.referrerId,
      contributionLinkId: this.self.contributionLinkId,
      publisherId: this.self.publisherId,
      contributions: this.self.contributions
        ? this.self.contributions.map((contribution) =>
            new ContributionLoggingView(contribution).toJSON(),
          )
        : undefined,
      messages: this.self.messages
        ? this.self.messages.map((message) => new ContributionMessageLoggingView(message).toJSON())
        : undefined,
      userContacts: this.self.userContacts
        ? this.self.userContacts.map((userContact) =>
            new UserContactLoggingView(userContact, false).toJSON(),
          )
        : undefined,
    }
  }
}
