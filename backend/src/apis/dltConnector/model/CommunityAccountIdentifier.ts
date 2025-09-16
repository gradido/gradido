export class CommunityAccountIdentifier {
  // for community user, uuid and communityUuid used
  userUuid: string
  accountNr?: number

  constructor(userUuid: string, accountNr?: number) {
    this.userUuid = userUuid
    this.accountNr = accountNr
  }
}
