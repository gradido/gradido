export class CommunityUser {
  // for community user, uuid and communityUuid used
  uuid: string
  accountNr?: number

  constructor(uuid: string, accountNr?: number) {
    this.uuid = uuid
    this.accountNr = accountNr
  }
}
